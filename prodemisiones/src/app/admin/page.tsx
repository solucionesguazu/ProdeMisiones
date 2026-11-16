"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calculator,
  PlusCircle,
  Users,
  Trash2,
  CalendarRange,
  CheckCircle2,
  History,
} from "lucide-react";
import Image from "next/image";

type Jornada = {
  id: number;
  nombre: string;
  activa: boolean;
  estado: string;
};

type Partido = {
  id: number;
  equipo_local: string;
  equipo_visitante: string;
  fecha_hora: string;
  jornada_id: number;
  jornadas?: { nombre: string } | null;
  goles_local?: number | null;
  goles_visitante?: number | null;
};

type JugadorRanking = {
  usuario_id: string;
  usuario_nombre: string;
  puntos: number;
  exactos: number;
  aciertos: number;
  jugados: number;
};

type Inscripcion = {
  id: number;
  usuario_id: string;
  jornada_id: number;
  pagado: boolean;
  jornadas?: { nombre: string } | null;
};

function parseGoles(valor: string): number | null {
  const limpio = valor.trim();
  if (!/^\d{1,2}$/.test(limpio)) return null;
  const goles = Number(limpio);
  return Number.isInteger(goles) && goles >= 0 && goles <= 30 ? goles : null;
}

export default function AdminPanel() {
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [nuevaJornada, setNuevaJornada] = useState("");
  const [guardandoJornada, setGuardandoJornada] = useState(false);

  const [partidosPendientes, setPartidosPendientes] = useState<Partido[]>([]);
  const [partidosFinalizados, setPartidosFinalizados] = useState<Partido[]>([]);
  const [resultados, setResultados] = useState<
    Record<number, { local: string; visitante: string }>
  >({});
  const [cargandoPartidoId, setCargandoPartidoId] = useState<number | null>(null);

  const [nuevoLocal, setNuevoLocal] = useState("");
  const [nuevoVisitante, setNuevoVisitante] = useState("");
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState("");
  const [guardandoPartido, setGuardandoPartido] = useState(false);

  const [jugadores, setJugadores] = useState<JugadorRanking[]>([]);
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);

  const router = useRouter();

  const cargarDatosAdmin = useCallback(async () => {
    const ahora = new Date().toISOString();

    const [
      resJornadas,
      resPendientes,
      resFinalizados,
      resRanking,
      resInscripciones,
    ] = await Promise.all([
      supabase
        .from("jornadas")
        .select("id, nombre, activa, estado")
        .order("id", { ascending: false }),
      supabase
        .from("partidos")
        .select(
          "id, equipo_local, equipo_visitante, fecha_hora, jornada_id, jornadas(nombre)"
        )
        .lt("fecha_hora", ahora)
        .is("goles_local", null)
        .order("fecha_hora", { ascending: true }),
      supabase
        .from("partidos")
        .select(
          "id, equipo_local, equipo_visitante, fecha_hora, jornada_id, goles_local, goles_visitante, jornadas(nombre)"
        )
        .lt("fecha_hora", ahora)
        .not("goles_local", "is", null)
        .order("fecha_hora", { ascending: false })
        .limit(10),
      supabase.rpc("obtener_ranking", { p_jornada_id: null }),
      supabase
        .from("inscripciones")
        .select("id, usuario_id, jornada_id, pagado, jornadas(nombre)")
        .order("id", { ascending: false }),
    ]);

    if (resJornadas.data) setJornadas(resJornadas.data as Jornada[]);
    if (resPendientes.data)
      setPartidosPendientes(resPendientes.data as unknown as Partido[]);

    if (resFinalizados.data) {
      const cerrados = resFinalizados.data as unknown as Partido[];
      setPartidosFinalizados(cerrados);
      const resultadosViejos: Record<number, { local: string; visitante: string }> =
        {};
      cerrados.forEach((p) => {
        resultadosViejos[p.id] = {
          local: String(p.goles_local ?? ""),
          visitante: String(p.goles_visitante ?? ""),
        };
      });
      setResultados((prev) => ({ ...prev, ...resultadosViejos }));
    }

    if (resRanking.data) {
      setJugadores(resRanking.data as JugadorRanking[]);
    }

    if (resInscripciones.data) {
      setInscripciones(resInscripciones.data as unknown as Inscripcion[]);
    }
  }, []);

  useEffect(() => {
    let activo = true;

    const verificarAdminYCargar = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/dashboard");
        return;
      }

      const { data: esAdminData, error } = await supabase.rpc("es_admin");
      if (error || esAdminData !== true) {
        alert("Acceso denegado.");
        router.push("/dashboard");
        return;
      }

      if (activo) {
        await cargarDatosAdmin();
      }
    };

    verificarAdminYCargar();

    return () => {
      activo = false;
    };
  }, [router, cargarDatosAdmin]);

  const crearNuevaJornada = async (e: React.FormEvent) => {
    e.preventDefault();
    const nombreLimpio = nuevaJornada.trim();
    if (!nombreLimpio || guardandoJornada) return;

    setGuardandoJornada(true);
    const { error } = await supabase
      .from("jornadas")
      .insert([{ nombre: nombreLimpio, estado: "abierta", activa: true }]);

    if (error) {
      alert("No se pudo crear la jornada.");
    } else {
      alert("¡Jornada creada con éxito!");
      setNuevaJornada("");
      await cargarDatosAdmin();
    }
    setGuardandoJornada(false);
  };

  const toggleEstadoJornada = async (jornada: Jornada) => {
    const nuevoEstado = jornada.estado === "abierta" ? "cerrada" : "abierta";
    const { error } = await supabase
      .from("jornadas")
      .update({ estado: nuevoEstado })
      .eq("id", jornada.id);

    if (error) {
      alert("No se pudo cambiar el estado de la jornada.");
    } else {
      await cargarDatosAdmin();
    }
  };

  const togglePago = async (idInscripcion: number, estadoActual: boolean) => {
    const { error } = await supabase
      .from("inscripciones")
      .update({
        pagado: !estadoActual,
        fecha_pago: !estadoActual ? new Date().toISOString() : null,
      })
      .eq("id", idInscripcion);

    if (error) {
      alert("No se pudo actualizar el estado del poroto.");
    } else {
      await cargarDatosAdmin();
    }
  };

  const handleInputChange = (
    partidoId: number,
    equipo: "local" | "visitante",
    valor: string
  ) => {
    if (valor !== "" && !/^\d{0,2}$/.test(valor)) return;
    setResultados((prev) => ({
      ...prev,
      [partidoId]: {
        local: prev[partidoId]?.local ?? "",
        visitante: prev[partidoId]?.visitante ?? "",
        [equipo]: valor,
      },
    }));
  };

  const cargarNuevoPartido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !nuevoLocal.trim() ||
      !nuevoVisitante.trim() ||
      !nuevaFecha ||
      !jornadaSeleccionada ||
      guardandoPartido
    ) {
      alert("Completá todos los campos y seleccioná una jornada.");
      return;
    }

    // Hora explícita de Argentina (-03:00) para evitar ambigüedad entre navegadores
    const fechaArgentina = new Date(`${nuevaFecha}:00-03:00`);
    if (Number.isNaN(fechaArgentina.getTime())) {
      alert("La fecha y hora ingresadas no son válidas.");
      return;
    }

    setGuardandoPartido(true);

    const { error } = await supabase.from("partidos").insert([
      {
        equipo_local: nuevoLocal.trim().toUpperCase(),
        equipo_visitante: nuevoVisitante.trim().toUpperCase(),
        fecha_hora: fechaArgentina.toISOString(),
        jornada_id: Number(jornadaSeleccionada),
      },
    ]);

    if (error) {
      alert("No se pudo publicar el partido.");
    } else {
      alert("¡Partido publicado con éxito!");
      setNuevoLocal("");
      setNuevoVisitante("");
      setNuevaFecha("");
      await cargarDatosAdmin();
    }
    setGuardandoPartido(false);
  };

  const guardarYCalcular = async (
    partidoId: number,
    esCorreccion: boolean = false
  ) => {
    if (cargandoPartidoId === partidoId) return;

    const res = resultados[partidoId];
    const golesLocal = parseGoles(res?.local ?? "");
    const golesVisitante = parseGoles(res?.visitante ?? "");

    if (golesLocal === null || golesVisitante === null) {
      alert("Completá ambos goles con números enteros entre 0 y 30.");
      return;
    }

    if (esCorreccion) {
      const ok = window.confirm(
        `¿Confirmás corregir el resultado oficial a ${golesLocal} - ${golesVisitante}? Se recalcularán todos los puntos y quedará registrado en auditoría.`
      );
      if (!ok) return;
    }

    setCargandoPartidoId(partidoId);

    const { error } = await supabase.rpc("cargar_resultado", {
      p_partido_id: partidoId,
      p_goles_local: golesLocal,
      p_goles_visitante: golesVisitante,
    });

    if (error) {
      alert(error.message || "Error al calcular puntos en el servidor.");
    } else {
      alert(
        esCorreccion
          ? "¡Corrección aplicada! Puntos recalculados y auditados."
          : "¡Resultados guardados y puntos repartidos exitosamente!"
      );
      await cargarDatosAdmin();
    }
    setCargandoPartidoId(null);
  };

  const eliminarJugador = async (idJugador: string, alias: string) => {
    const confirmacion = window.confirm(
      `¿Seguro que querés borrar todos los pronósticos de ${alias} en el torneo?`
    );
    if (!confirmacion) return;

    const { error } = await supabase
      .from("pronosticos")
      .delete()
      .eq("usuario_id", idJugador);

    if (error) {
      alert("No se pudieron eliminar los pronósticos.");
    } else {
      alert(`Pronósticos de ${alias} eliminados.`);
      await cargarDatosAdmin();
    }
  };

  const mapaNombres = new Map<string, string>();
  jugadores.forEach((j) => mapaNombres.set(j.usuario_id, j.usuario_nombre));

  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 sm:p-6">
      <div className="max-w-5xl mx-auto pb-12">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-slate-800 p-6 rounded-2xl border border-amber-500/50 shadow-xl gap-4">
          <div className="flex items-center gap-4">
            <Image
              src="/logo.jpg"
              alt="Logo"
              width={50}
              height={50}
              className="rounded-lg object-cover"
            />
            <div>
              <h1 className="text-2xl font-extrabold text-amber-500">
                PANEL DE ADMINISTRADOR
              </h1>
              <p className="text-slate-400 text-sm">
                Centro de Control Prode Misiones
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center text-slate-300 hover:text-white transition-colors bg-slate-700 px-4 py-2 rounded-lg text-sm font-bold border border-slate-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Juego
          </Link>
        </header>

        {/* GESTIÓN DE JORNADAS */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg mb-6">
          <h2 className="text-xl font-bold mb-6 text-indigo-400 flex items-center gap-2">
            <CalendarRange className="w-5 h-5" /> Gestión de Jornadas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form
              onSubmit={crearNuevaJornada}
              className="bg-slate-900 p-4 rounded-xl border border-slate-700"
            >
              <label className="block text-sm font-bold text-slate-400 mb-2">
                Crear Nueva Jornada
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  maxLength={40}
                  placeholder="Ej: Fecha 1"
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  value={nuevaJornada}
                  onChange={(e) => setNuevaJornada(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={guardandoJornada}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {guardandoJornada ? "..." : "Crear"}
                </button>
              </div>
            </form>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 max-h-40 overflow-y-auto">
              <label className="block text-sm font-bold text-slate-400 mb-2">
                Jornadas Existentes
              </label>
              {jornadas.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No hay jornadas creadas.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {jornadas.map((j) => (
                    <li
                      key={j.id}
                      className="text-sm text-white flex justify-between items-center bg-slate-800 p-2 rounded"
                    >
                      <span>{j.nombre}</span>
                      <button
                        onClick={() => toggleEstadoJornada(j)}
                        className={`text-xs px-2.5 py-1 rounded font-bold transition-colors ${
                          j.estado === "abierta"
                            ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        }`}
                      >
                        {j.estado === "abierta" ? "Abierta" : "Cerrada"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ACREDITACIÓN DE POROTOS */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg mb-6">
          <h2 className="text-xl font-bold mb-6 text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Acreditación de Porotos (Pagos)
          </h2>
          {inscripciones.length === 0 ? (
            <div className="text-center py-6 bg-slate-900 rounded-xl border border-slate-700">
              <p className="text-slate-500 text-sm">
                No hay solicitudes de participación registradas aún.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-slate-900 rounded-xl border border-slate-700">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="p-4">Jugador</th>
                    <th className="p-4">Jornada</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {inscripciones.map((ins, idx) => {
                    const nombreMostrar =
                      mapaNombres.get(ins.usuario_id) ||
                      `Participante #${inscripciones.length - idx}`;

                    return (
                      <tr
                        key={ins.id}
                        className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="p-4 font-bold text-white">
                          {nombreMostrar}
                        </td>
                        <td className="p-4 text-indigo-400 font-semibold">
                          {ins.jornadas?.nombre || "Sin jornada"}
                        </td>
                        <td className="p-4">
                          {ins.pagado ? (
                            <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
                              PAGADO
                            </span>
                          ) : (
                            <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">
                              PENDIENTE
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => togglePago(ins.id, ins.pagado)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                              ins.pagado
                                ? "bg-slate-700 hover:bg-slate-600 text-white"
                                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                            }`}
                          >
                            {ins.pagado ? "Revocar" : "Acreditar Poroto"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CREAR PARTIDO + REPARTIR PUNTOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg h-fit">
            <h2 className="text-xl font-bold mb-6 text-emerald-400 flex items-center gap-2">
              <PlusCircle className="w-5 h-5" /> Crear Nuevo Partido
            </h2>
            <form onSubmit={cargarNuevoPartido} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-1">
                  Jornada
                </label>
                <select
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
                  value={jornadaSeleccionada}
                  onChange={(e) => setJornadaSeleccionada(e.target.value)}
                >
                  <option value="">Seleccioná una jornada...</option>
                  {jornadas.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-1">
                  Equipo Local
                </label>
                <input
                  type="text"
                  required
                  maxLength={40}
                  placeholder="Ej: Boca Juniors"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
                  value={nuevoLocal}
                  onChange={(e) => setNuevoLocal(e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-1">
                  Equipo Visitante
                </label>
                <input
                  type="text"
                  required
                  maxLength={40}
                  placeholder="Ej: River Plate"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
                  value={nuevoVisitante}
                  onChange={(e) =>
                    setNuevoVisitante(e.target.value.toUpperCase())
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-1">
                  Fecha y Hora de Inicio (Hora Argentina)
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none [color-scheme:dark]"
                  value={nuevaFecha}
                  onChange={(e) => setNuevaFecha(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={guardandoPartido || jornadas.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-2 disabled:opacity-50"
              >
                {jornadas.length === 0
                  ? "Primero creá una jornada"
                  : guardandoPartido
                  ? "Publicando partido..."
                  : "Publicar Partido"}
              </button>
            </form>
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg h-fit">
            <h2 className="text-xl font-bold mb-6 text-amber-500 flex items-center gap-2">
              <Calculator className="w-5 h-5" /> Repartir Puntos (Nuevos)
            </h2>
            {partidosPendientes.length === 0 ? (
              <div className="text-center py-10 bg-slate-900 rounded-xl border border-slate-700">
                <p className="text-emerald-400 font-bold text-lg mb-2">
                  ¡Todo al día!
                </p>
                <p className="text-slate-500 text-sm">
                  No hay partidos terminados pendientes de resultados.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {partidosPendientes.map((partido) => (
                  <li
                    key={partido.id}
                    className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col items-center gap-4"
                  >
                    <div className="text-center w-full border-b border-slate-800 pb-3">
                      <span className="text-xs text-indigo-400 font-bold uppercase block mb-1">
                        {partido.jornadas?.nombre || "Sin Jornada"}
                      </span>
                      <span className="text-xs text-amber-500 font-bold uppercase tracking-wider block mb-1">
                        {new Date(partido.fecha_hora).toLocaleDateString(
                          "es-AR",
                          {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                      <span className="font-bold text-lg">
                        {partido.equipo_local} vs {partido.equipo_visitante}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          placeholder="L"
                          className="w-12 h-12 bg-slate-800 border-2 border-slate-600 rounded-lg text-center font-bold text-lg focus:border-amber-500 focus:outline-none"
                          value={resultados[partido.id]?.local ?? ""}
                          onChange={(e) =>
                            handleInputChange(partido.id, "local", e.target.value)
                          }
                        />
                        <span className="text-slate-500 font-bold">-</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          placeholder="V"
                          className="w-12 h-12 bg-slate-800 border-2 border-slate-600 rounded-lg text-center font-bold text-lg focus:border-amber-500 focus:outline-none"
                          value={resultados[partido.id]?.visitante ?? ""}
                          onChange={(e) =>
                            handleInputChange(
                              partido.id,
                              "visitante",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <button
                        onClick={() => guardarYCalcular(partido.id, false)}
                        disabled={cargandoPartidoId === partido.id}
                        className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                      >
                        {cargandoPartidoId === partido.id
                          ? "Calculando..."
                          : "Guardar & Calcular"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* CORRECCIÓN DE RESULTADOS PREVIOS */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg mb-6">
          <h2 className="text-xl font-bold mb-6 text-red-400 flex items-center gap-2">
            <History className="w-5 h-5" /> Corregir Resultados Previos
          </h2>
          {partidosFinalizados.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4 bg-slate-900 rounded-lg border border-slate-700">
              No hay partidos cerrados para corregir.
            </p>
          ) : (
            <ul className="space-y-4">
              {partidosFinalizados.map((partido) => (
                <li
                  key={partido.id}
                  className="bg-slate-900 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center gap-4"
                >
                  <div className="flex w-full justify-between items-center text-sm border-b border-slate-800 pb-2">
                    <span className="text-indigo-400 font-bold">
                      {partido.jornadas?.nombre}
                    </span>
                    <span className="text-slate-500">
                      {new Date(partido.fecha_hora).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
                    <span className="font-bold text-md sm:w-36 sm:text-right">
                      {partido.equipo_local}
                    </span>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        className="w-12 h-12 bg-slate-800 border-2 border-red-900/50 rounded-lg text-center font-bold text-lg focus:border-red-500 focus:outline-none"
                        value={resultados[partido.id]?.local ?? ""}
                        onChange={(e) =>
                          handleInputChange(partido.id, "local", e.target.value)
                        }
                      />
                      <span className="text-slate-500 font-bold">-</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        className="w-12 h-12 bg-slate-800 border-2 border-red-900/50 rounded-lg text-center font-bold text-lg focus:border-red-500 focus:outline-none"
                        value={resultados[partido.id]?.visitante ?? ""}
                        onChange={(e) =>
                          handleInputChange(
                            partido.id,
                            "visitante",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <span className="font-bold text-md sm:w-36 sm:text-left">
                      {partido.equipo_visitante}
                    </span>
                    <button
                      onClick={() => guardarYCalcular(partido.id, true)}
                      disabled={cargandoPartidoId === partido.id}
                      className="w-full sm:w-auto bg-slate-700 hover:bg-red-500 text-white font-bold px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                    >
                      {cargandoPartidoId === partido.id
                        ? "Corrigiendo..."
                        : "Corregir Puntos"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* GESTIÓN DE JUGADORES */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 border-b border-slate-700 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" /> Gestión de
              Jugadores
            </h2>
            <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-700 text-sm font-bold">
              Total Activos:{" "}
              <span className="text-emerald-400 ml-1">{jugadores.length}</span>
            </div>
          </div>

          {jugadores.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">
              Aún no hay jugadores activos.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jugadores.map((jugador) => (
                <div
                  key={jugador.usuario_id}
                  className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col justify-between"
                >
                  <div className="mb-4">
                    <p
                      className="font-bold text-lg text-white truncate"
                      title={jugador.usuario_nombre}
                    >
                      {jugador.usuario_nombre}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {jugador.puntos} pts · {jugador.exactos} exactos
                    </p>
                    <div className="mt-2 bg-slate-800 inline-block px-2 py-1 rounded text-xs font-semibold text-emerald-400">
                      {jugador.jugados} partidos jugados
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    <button
                      onClick={() =>
                        eliminarJugador(
                          jugador.usuario_id,
                          jugador.usuario_nombre
                        )
                      }
                      className="flex-1 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/50 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Borrar Pronósticos
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}