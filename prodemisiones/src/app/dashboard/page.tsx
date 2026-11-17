"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  CheckCircle2,
  Edit2,
  History,
  Trophy,
  CalendarDays,
  Ticket,
  Clock,
} from "lucide-react";
import Image from "next/image";

type Jornada = {
  id: number;
  nombre: string;
  estado: string;
  activa: boolean;
};

type Partido = {
  id: number;
  equipo_local: string;
  equipo_visitante: string;
  fecha_hora: string;
  goles_local: number | null;
  goles_visitante: number | null;
  jornada_id: number;
};

type Posicion = {
  usuario_id: string;
  usuario_nombre: string;
  puntos: number;
  exactos: number;
  aciertos: number;
  jugados: number;
};

type EstadoPronostico = {
  local: string;
  visitante: string;
  puntos_obtenidos: number;
  guardado: boolean;
};

type InscripcionUsuario = {
  jornada_id: number;
  pagado: boolean;
};

function parseGoles(valor: string): number | null {
  const limpio = valor.trim();
  if (!/^\d{1,2}$/.test(limpio)) return null;
  const goles = Number(limpio);
  return Number.isInteger(goles) && goles >= 0 && goles <= 30 ? goles : null;
}

export default function Dashboard() {
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [esAdmin, setEsAdmin] = useState<boolean>(false);

  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [jornadaActivaId, setJornadaActivaId] = useState<number | null>(null);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [predicciones, setPredicciones] = useState<Record<number, EstadoPronostico>>({});
  const [inscripciones, setInscripciones] = useState<Record<number, InscripcionUsuario>>({});

  const [tabRanking, setTabRanking] = useState<"fecha" | "global">("fecha");
  const [rankingFecha, setRankingFecha] = useState<Posicion[]>([]);
  const [rankingGlobal, setRankingGlobal] = useState<Posicion[]>([]);

  const [offsetServidorMs, setOffsetServidorMs] = useState<number>(0);
  const [ahora, setAhora] = useState<Date | null>(null);

  const [guardandoPartidoId, setGuardandoPartidoId] = useState<number | null>(null);
  const [solicitandoPoroto, setSolicitandoPoroto] = useState<boolean>(false);
  const [mostrarBienvenida, setMostrarBienvenida] = useState<boolean>(false);
  const [cargandoInicial, setCargandoInicial] = useState<boolean>(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const router = useRouter();

  const cargarRankings = useCallback(async (jornadaId: number | null) => {
    const [resFecha, resGlobal] = await Promise.all([
      jornadaId !== null
        ? supabase.rpc("obtener_ranking", { p_jornada_id: jornadaId })
        : Promise.resolve({ data: [] as Posicion[], error: null }),
      supabase.rpc("obtener_ranking", { p_jornada_id: null }),
    ]);

    if (!resFecha.error && resFecha.data) {
      setRankingFecha(resFecha.data as Posicion[]);
    }
    if (!resGlobal.error && resGlobal.data) {
      setRankingGlobal(resGlobal.data as Posicion[]);
    }
  }, []);

  useEffect(() => {
    const bienvenidaVisto = localStorage.getItem("bienvenida_prode");
    if (!bienvenidaVisto) {
      setMostrarBienvenida(true);
      localStorage.setItem("bienvenida_prode", "true");
    }

    let activo = true;

    const inicializar = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        if (!activo) return;

        setUserId(user.id);
        const nombre =
          (user.user_metadata?.nombre as string | undefined)?.trim() ||
          user.email?.split("@")[0] ||
          "Jugador";
        setUserName(nombre);

        // Sincronizar hora oficial del servidor midiendo latencia
        const t0 = Date.now();
        const { data: horaSrv } = await supabase.rpc("obtener_hora_servidor");
        const t1 = Date.now();
        if (horaSrv) {
          const latenciaMedia = (t1 - t0) / 2;
          const offset = new Date(horaSrv as string).getTime() + latenciaMedia - t1;
          setOffsetServidorMs(offset);
          setAhora(new Date(Date.now() + offset));
        } else {
          setAhora(new Date());
        }

        // Verificar si es admin para mostrar acceso directo
        const { data: adminCheck } = await supabase.rpc("es_admin");
        if (activo && adminCheck === true) {
          setEsAdmin(true);
        }

        // Cargar jornadas, partidos, inscripciones propias y pronósticos propios
        const [resJornadas, resPartidos, resInscripciones, resPronosticos] =
          await Promise.all([
            supabase
              .from("jornadas")
              .select("id, nombre, estado, activa")
              .order("id", { ascending: false }),
            supabase
              .from("partidos")
              .select(
                "id, equipo_local, equipo_visitante, fecha_hora, goles_local, goles_visitante, jornada_id"
              )
              .order("fecha_hora", { ascending: true }),
            supabase
              .from("inscripciones")
              .select("jornada_id, pagado")
              .eq("usuario_id", user.id),
            supabase
              .from("pronosticos")
              .select(
                "partido_id, prediccion_local, prediccion_visitante, puntos_obtenidos"
              )
              .eq("usuario_id", user.id),
          ]);

        if (resJornadas.error || resPartidos.error) {
          throw new Error("No se pudieron cargar los datos de la fecha.");
        }

        if (!activo) return;

        const listaJornadas = (resJornadas.data ?? []) as Jornada[];
        setJornadas(listaJornadas);

        const jornadaPorDefecto =
          listaJornadas.find((j) => j.estado === "abierta") ||
          listaJornadas[0] ||
          null;
        const jId = jornadaPorDefecto ? jornadaPorDefecto.id : null;
        setJornadaActivaId(jId);

        setPartidos((resPartidos.data ?? []) as Partido[]);

        const mapaInsc: Record<number, InscripcionUsuario> = {};
        (resInscripciones.data ?? []).forEach((ins) => {
          mapaInsc[ins.jornada_id] = {
            jornada_id: ins.jornada_id,
            pagado: Boolean(ins.pagado),
          };
        });
        setInscripciones(mapaInsc);

        const mapaPred: Record<number, EstadoPronostico> = {};
        (resPronosticos.data ?? []).forEach((p) => {
          mapaPred[p.partido_id] = {
            local: String(p.prediccion_local ?? ""),
            visitante: String(p.prediccion_visitante ?? ""),
            puntos_obtenidos: p.puntos_obtenidos ?? 0,
            guardado: true,
          };
        });
        setPredicciones(mapaPred);

        await cargarRankings(jId);
      } catch {
        if (activo) {
          setErrorCarga("Ocurrió un problema al cargar el tablero. Recargá la página.");
        }
      } finally {
        if (activo) setCargandoInicial(false);
      }
    };

    inicializar();

    return () => {
      activo = false;
    };
  }, [router, cargarRankings]);

  // Reloj sincronizado en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setAhora(new Date(Date.now() + offsetServidorMs));
    }, 1000);
    return () => clearInterval(interval);
  }, [offsetServidorMs]);

  const cambiarJornada = async (nuevoId: number) => {
    setJornadaActivaId(nuevoId);
    await cargarRankings(nuevoId);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const solicitarPoroto = async () => {
    if (!jornadaActivaId || !userId || solicitandoPoroto) return;
    setSolicitandoPoroto(true);

    const { error } = await supabase.from("inscripciones").insert([
      {
        usuario_id: userId,
        jornada_id: jornadaActivaId,
        pagado: false,
      },
    ]);

    if (error) {
      alert("No se pudo registrar la solicitud. Intentá nuevamente.");
    } else {
      setInscripciones((prev) => ({
        ...prev,
        [jornadaActivaId]: { jornada_id: jornadaActivaId, pagado: false },
      }));
    }
    setSolicitandoPoroto(false);
  };

  const handleInputChange = (
    partidoId: number,
    equipo: "local" | "visitante",
    valor: string
  ) => {
    if (valor !== "" && !/^\d{0,2}$/.test(valor)) return;
    setPredicciones((prev) => ({
      ...prev,
      [partidoId]: {
        local: prev[partidoId]?.local ?? "",
        visitante: prev[partidoId]?.visitante ?? "",
        puntos_obtenidos: prev[partidoId]?.puntos_obtenidos ?? 0,
        guardado: false,
        [equipo]: valor,
      },
    }));
  };

  const habilitarEdicion = (partidoId: number) => {
    setPredicciones((prev) => ({
      ...prev,
      [partidoId]: { ...prev[partidoId], guardado: false },
    }));
  };

  const guardarPronostico = async (partidoId: number) => {
    if (guardandoPartidoId === partidoId) return;

    const pred = predicciones[partidoId];
    const golesLocal = parseGoles(pred?.local ?? "");
    const golesVisitante = parseGoles(pred?.visitante ?? "");

    if (golesLocal === null || golesVisitante === null) {
      alert("Ingresá un marcador válido (números enteros entre 0 y 30).");
      return;
    }

    setGuardandoPartidoId(partidoId);

    const { error } = await supabase.rpc("guardar_pronostico", {
      p_partido_id: partidoId,
      p_local: golesLocal,
      p_visitante: golesVisitante,
    });

    if (error) {
      alert(error.message || "No se pudo guardar el pronóstico.");
    } else {
      setPredicciones((prev) => ({
        ...prev,
        [partidoId]: {
          ...prev[partidoId],
          local: String(golesLocal),
          visitante: String(golesVisitante),
          guardado: true,
        },
      }));
      await cargarRankings(jornadaActivaId);
    }

    setGuardandoPartidoId(null);
  };

  const formatFecha = (fechaString: string) => {
    return new Date(fechaString).toLocaleDateString("es-AR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const jornadaActualObj = jornadas.find((j) => j.id === jornadaActivaId);
  const inscripcionActual =
    jornadaActivaId !== null ? inscripciones[jornadaActivaId] : undefined;
  const estaHabilitadoParaJugar = Boolean(inscripcionActual?.pagado);

  const partidosDeLaJornada = partidos.filter(
    (p) => p.jornada_id === jornadaActivaId
  );

  const partidosACompletar = ahora
    ? partidosDeLaJornada.filter((p) => new Date(p.fecha_hora) > ahora)
    : [];
  const partidosIniciadosOFinalizados = ahora
    ? partidosDeLaJornada
        .filter((p) => new Date(p.fecha_hora) <= ahora)
        .reverse()
    : [];

  const posicionesMostradas =
    tabRanking === "fecha" ? rankingFecha : rankingGlobal;

  if (cargandoInicial) {
    return (
      <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-slate-400 animate-pulse font-semibold">
          Cargando cancha...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 pb-20">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl gap-4">
          <div className="flex items-center gap-4">
            <Image
              src="/logo.jpg"
              alt="Logo Prode Misiones"
              width={64}
              height={64}
              className="rounded-lg shadow-md"
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                PRODE <span className="text-emerald-400">MISIONES</span>
              </h1>
              <p className="text-slate-400 mt-1 text-sm">Hola, {userName}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {esAdmin && (
              <Link
                href="/admin"
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm font-extrabold"
              >
                Panel Admin
              </Link>
            )}
            <Link
              href="/configuracion"
              className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
              title="Configuración de Perfil"
            >
              <Settings className="w-6 h-6" />
            </Link>
            <Link
              href="/reglas"
              className="bg-slate-700 hover:bg-emerald-500 text-slate-200 hover:text-slate-900 px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-bold border border-slate-600 hover:border-emerald-500"
            >
              Ver Reglas
            </Link>
            <button
              onClick={handleLogout}
              className="bg-slate-700 hover:bg-red-500 text-slate-200 hover:text-white px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-bold border border-slate-600 hover:border-red-500"
            >
              Salir
            </button>
          </div>
        </header>

        {errorCarga && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-300 p-4 rounded-xl mb-6 text-sm">
            {errorCarga}
          </div>
        )}

        {/* SELECTOR DE FECHA / JORNADA Y ESTADO DE POROTO */}
        <div className="bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-700 shadow-lg mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <CalendarDays className="w-5 h-5 text-emerald-400 shrink-0" />
            <select
              value={jornadaActivaId ?? ""}
              onChange={(e) => cambiarJornada(Number(e.target.value))}
              className="w-full md:w-64 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-bold text-sm focus:border-emerald-500 focus:outline-none"
            >
              {jornadas.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.nombre} ({j.estado === "abierta" ? "Abierta" : "Cerrada"})
                </option>
              ))}
            </select>
          </div>

          {jornadaActualObj && (
            <div className="w-full md:w-auto flex flex-col items-stretch md:items-end gap-2">
              {estaHabilitadoParaJugar ? (
                <span className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold">
                  <Ticket className="w-4 h-4" /> Poroto acreditado en{" "}
                  {jornadaActualObj.nombre}
                </span>
              ) : (
                <>
                  {inscripcionActual ? (
                    <span className="inline-flex items-center justify-center gap-2 bg-amber-500/15 border border-amber-500/40 text-amber-300 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold">
                      <Clock className="w-4 h-4 shrink-0" /> Solicitud enviada —
                      Esperando acreditación
                    </span>
                  ) : (
                    <button
                      onClick={solicitarPoroto}
                      disabled={
                        solicitandoPoroto ||
                        jornadaActualObj.estado !== "abierta"
                      }
                      className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-slate-900 font-extrabold px-5 py-2.5 rounded-lg text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Ticket className="w-4 h-4" />
                      {solicitandoPoroto
                        ? "Solicitando..."
                        : "Adquirir / Acreditar mi poroto ($3.000)"}
                    </button>
                  )}

                  {/* Alias y aviso obligatorio de comprobante */}
                  <div className="bg-slate-900/90 border border-amber-500/40 rounded-lg px-3.5 py-2 text-xs text-slate-200 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                    <span>
                      💳 Alias:{" "}
                      <strong className="text-emerald-400 font-mono select-all">
                        prod-misiones
                      </strong>
                    </span>
                    <span className="hidden sm:inline text-slate-600">|</span>
                    <span className="text-amber-300 font-semibold">
                      📲 Importante: enviar comprobante al{" "}
                      <a
                        href="https://wa.me/5493764803852?text=Hola!%20Env%C3%ADo%20mi%20comprobante%20de%20pago%20para%20acreditar%20mi%20poroto%20en%20Prode%20Misiones."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-amber-200 font-bold"
                      >
                        3764-803852
                      </a>
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUMNA IZQUIERDA: PARTIDOS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
              <h2 className="text-xl font-bold mb-6 text-emerald-400">
                Partidos a completar
              </h2>

              {!estaHabilitadoParaJugar && partidosACompletar.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-5 text-xs sm:text-sm text-amber-200">
                  Tenés que tener tu poroto acreditado en esta fecha para poder
                  guardar tus pronósticos.
                </div>
              )}

              {partidosACompletar.length === 0 ? (
                <p className="text-slate-400 text-sm">
                  No hay partidos pendientes de pronóstico en esta fecha.
                </p>
              ) : (
                <ul className="space-y-4">
                  {partidosACompletar.map((partido) => {
                    const estaGuardado = predicciones[partido.id]?.guardado;
                    const bloqueado = !estaHabilitadoParaJugar || estaGuardado;

                    return (
                      <li
                        key={partido.id}
                        className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col items-center"
                      >
                        <span className="text-xs text-slate-400 mb-3">
                          {formatFecha(partido.fecha_hora)}
                        </span>

                        <div className="flex items-center justify-center gap-2 sm:gap-3 w-full mb-4">
                          <span className="font-bold text-xs sm:text-sm text-right w-24 sm:w-28 truncate">
                            {partido.equipo_local}
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            className="w-12 h-12 bg-slate-800 border-2 border-slate-600 rounded-lg text-center font-bold text-lg focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                            value={predicciones[partido.id]?.local ?? ""}
                            onChange={(e) =>
                              handleInputChange(partido.id, "local", e.target.value)
                            }
                            disabled={bloqueado}
                          />
                          <span className="text-slate-600 font-bold">-</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            className="w-12 h-12 bg-slate-800 border-2 border-slate-600 rounded-lg text-center font-bold text-lg focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                            value={predicciones[partido.id]?.visitante ?? ""}
                            onChange={(e) =>
                              handleInputChange(
                                partido.id,
                                "visitante",
                                e.target.value
                              )
                            }
                            disabled={bloqueado}
                          />
                          <span className="font-bold text-xs sm:text-sm text-left w-24 sm:w-28 truncate">
                            {partido.equipo_visitante}
                          </span>
                        </div>

                        {estaHabilitadoParaJugar &&
                          (estaGuardado ? (
                            <button
                              onClick={() => habilitarEdicion(partido.id)}
                              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              Pronóstico Listo (Editar)
                            </button>
                          ) : (
                            <button
                              onClick={() => guardarPronostico(partido.id)}
                              disabled={guardandoPartidoId === partido.id}
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <Edit2 className="w-4 h-4" />
                              {guardandoPartidoId === partido.id
                                ? "Guardando..."
                                : "Guardar Predicción"}
                            </button>
                          ))}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* PARTIDOS ACTIVOS / FINALIZADOS */}
            {partidosIniciadosOFinalizados.length > 0 && (
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-slate-300 flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-500" /> Partidos
                  activos y finalizados
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {partidosIniciadosOFinalizados.map((partido) => {
                    const resultadoOficial =
                      partido.goles_local !== null &&
                      partido.goles_visitante !== null;
                    const miPronostico = predicciones[partido.id];

                    return (
                      <div
                        key={partido.id}
                        className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col items-center"
                      >
                        <div className="flex items-center justify-between w-full mb-3">
                          <span className="text-[11px] text-slate-400">
                            {formatFecha(partido.fecha_hora)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              resultadoOficial
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-amber-500/15 text-amber-400"
                            }`}
                          >
                            {resultadoOficial
                              ? "Partido Finalizado"
                              : "En juego / Cerrado"}
                          </span>
                        </div>

                        <div className="flex items-center justify-center gap-2 w-full mb-3">
                          <span className="font-bold text-xs sm:text-sm text-right w-24 truncate">
                            {partido.equipo_local}
                          </span>
                          <div
                            className={`w-8 h-8 flex items-center justify-center rounded font-bold text-sm border ${
                              resultadoOficial
                                ? "bg-emerald-950 border-emerald-700 text-emerald-400"
                                : "bg-slate-800 border-slate-700 text-slate-500"
                            }`}
                          >
                            {resultadoOficial ? partido.goles_local : "-"}
                          </div>
                          <span className="text-slate-600 font-bold">-</span>
                          <div
                            className={`w-8 h-8 flex items-center justify-center rounded font-bold text-sm border ${
                              resultadoOficial
                                ? "bg-emerald-950 border-emerald-700 text-emerald-400"
                                : "bg-slate-800 border-slate-700 text-slate-500"
                            }`}
                          >
                            {resultadoOficial ? partido.goles_visitante : "-"}
                          </div>
                          <span className="font-bold text-xs sm:text-sm text-left w-24 truncate">
                            {partido.equipo_visitante}
                          </span>
                        </div>

                        <div className="bg-slate-800 px-3 py-2 rounded-lg flex flex-col items-center gap-1 w-full justify-center border border-slate-700/50">
                          <span className="text-slate-400 text-xs">
                            Tu pronóstico:{" "}
                            <strong className="text-slate-200">
                              {miPronostico
                                ? `${miPronostico.local} a ${miPronostico.visitante}`
                                : "Sin jugar"}
                            </strong>
                          </span>
                          {resultadoOficial && miPronostico && (
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                miPronostico.puntos_obtenidos === 6
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : miPronostico.puntos_obtenidos === 3
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-slate-700 text-slate-400"
                              }`}
                            >
                              +{miPronostico.puntos_obtenidos} pts
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: TABLA DE POSICIONES */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg h-fit">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                <Trophy className="w-5 h-5" /> Posiciones
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-700 mb-5">
              <button
                onClick={() => setTabRanking("fecha")}
                className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                  tabRanking === "fecha"
                    ? "bg-emerald-500 text-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Esta Fecha
              </button>
              <button
                onClick={() => setTabRanking("global")}
                className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                  tabRanking === "global"
                    ? "bg-emerald-500 text-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Global
              </button>
            </div>

            {posicionesMostradas.length === 0 ? (
              <p className="text-slate-400 text-sm">
                Todavía no hay jugadores habilitados en esta tabla.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {posicionesMostradas.map((pos, index) => (
                  <Link
                    href={`/jugador/${pos.usuario_id}`}
                    key={pos.usuario_id}
                    className="block transition-transform hover:scale-[1.02]"
                  >
                    <li className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700 hover:border-emerald-500/50 cursor-pointer">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`font-bold w-6 text-center shrink-0 ${
                            index === 0
                              ? "text-yellow-400"
                              : index === 1
                              ? "text-slate-300"
                              : index === 2
                              ? "text-amber-600"
                              : "text-slate-500"
                          }`}
                        >
                          {index + 1}°
                        </span>
                        <div className="min-w-0">
                          <p
                            className="text-sm font-medium truncate"
                            title={pos.usuario_nombre}
                          >
                            {pos.usuario_nombre}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {pos.exactos} exactos · {pos.aciertos} aciertos
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full text-sm shrink-0">
                        {pos.puntos} pts
                      </span>
                    </li>
                  </Link>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {mostrarBienvenida && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-emerald-500/30 p-8 rounded-2xl shadow-2xl max-w-lg w-full relative">
            <h2 className="text-2xl font-bold text-white mb-4">
              ¡Bienvenido a Prode Misiones! ⚽
            </h2>
            <div className="space-y-4 text-slate-300 text-sm leading-relaxed mb-8">
              <p>
                Nacimos de la pasión por el fútbol y de esas eternas
                discusiones entre amigos para demostrar quién sabe más.
              </p>
              <p>
                🏆 Acreditá tu poroto en la fecha abierta, cargá tus
                pronósticos antes del pitazo inicial y competí por la punta.
              </p>
            </div>
            <button
              onClick={() => setMostrarBienvenida(false)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-4 rounded-lg transition-colors"
            >
              ¡Entendido, a jugar!
            </button>
          </div>
        </div>
      )}
    </main>
  );
}