"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, History } from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Partido = {
  id: number;
  equipo_local: string;
  equipo_visitante: string;
  fecha_hora: string;
  goles_local: number | null;
  goles_visitante: number | null;
};

type Pronostico = {
  partido_id: number;
  prediccion_local: number;
  prediccion_visitante: number;
  puntos_obtenidos: number | null;
  usuario_alias: string | null;
};

const esUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export default function PerfilJugador() {
  const params = useParams<{ id: string }>();
  const idJugador = decodeURIComponent(String(params?.id ?? "")).trim();

  const [nombreJugador, setNombreJugador] = useState("Jugador");
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [pronosticos, setPronosticos] = useState<Record<number, Pronostico>>({});
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!idJugador) return;

    const cargarDatos = async () => {
      setCargando(true);
      setErrorMsg(null);

      // 1. Partidos que ya empezaron
      const { data: partidosData, error: errPartidos } = await supabase
        .from("partidos")
        .select("*")
        .lte("fecha_hora", new Date().toISOString())
        .order("fecha_hora", { ascending: false });

      if (errPartidos) {
        setErrorMsg("No se pudieron cargar los partidos: " + errPartidos.message);
        setCargando(false);
        return;
      }
      setPartidos(partidosData ?? []);

      // 2. Pronósticos SOLO de este jugador (filtrado en la base)
      const consulta = supabase
        .from("pronosticos")
        .select("partido_id, prediccion_local, prediccion_visitante, puntos_obtenidos, usuario_alias");

      const { data: pronData, error: errPron } = esUuid(idJugador)
        ? await consulta.eq("usuario_id", idJugador)
        : await consulta.eq("usuario_alias", idJugador); // datos viejos sin UUID

      if (errPron) {
        setErrorMsg("No se pudieron cargar los pronósticos: " + errPron.message);
        setCargando(false);
        return;
      }

      if (pronData && pronData.length > 0) {
        setNombreJugador(pronData[0].usuario_alias || "Jugador");
        const dic: Record<number, Pronostico> = {};
        pronData.forEach((p) => {
          dic[p.partido_id] = p;
        });
        setPronosticos(dic);
      }

      setCargando(false);
    };

    cargarDatos();
  }, [idJugador]);

  const formatFecha = (f: string) =>
    new Date(f).toLocaleDateString("es-AR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const totalPuntos = Object.values(pronosticos).reduce(
    (acc, p) => acc + (p.puntos_obtenidos || 0),
    0
  );

  if (cargando) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center text-emerald-400 font-bold">
        Cargando estadísticas...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500">
              <User className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Historial de pronósticos de</p>
              <h1 className="text-3xl font-extrabold text-white">{nombreJugador}</h1>
              <p className="text-xs text-slate-500 mt-1">
  ID: {idJugador} · pronósticos encontrados: {Object.keys(pronosticos).length}
</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 px-6 py-2 rounded-xl text-center">
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Puntos Totales</p>
              <p className="text-2xl font-black text-white">{totalPuntos}</p>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center text-slate-300 hover:text-white transition-colors bg-slate-700 px-4 py-3 rounded-lg text-sm font-bold border border-slate-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver
            </Link>
          </div>
        </header>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6 text-sm">
            {errorMsg}
          </div>
        )}

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <h2 className="text-xl font-bold mb-6 text-emerald-400 flex items-center gap-2">
            <History className="w-5 h-5" /> Partidos Finalizados
          </h2>

          {partidos.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">
              Todavía no hay partidos finalizados para analizar.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {partidos.map((partido) => {
                const hayResultado = partido.goles_local !== null && partido.goles_visitante !== null;
                const pron = pronosticos[partido.id];
                const pts = pron?.puntos_obtenidos ?? 0;

                return (
                  <div key={partido.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col items-center">
                    <span className="text-xs text-slate-400 mb-3">{formatFecha(partido.fecha_hora)}</span>

                    <div className="flex items-center justify-center gap-2 w-full mb-4">
                      <span className="font-bold text-sm text-right w-20 truncate">{partido.equipo_local}</span>
                      <div className={`w-8 h-8 flex items-center justify-center rounded font-bold text-sm ${hayResultado ? "bg-emerald-900 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                        {hayResultado ? partido.goles_local : "-"}
                      </div>
                      <span className="text-slate-600 font-bold">-</span>
                      <div className={`w-8 h-8 flex items-center justify-center rounded font-bold text-sm ${hayResultado ? "bg-emerald-900 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                        {hayResultado ? partido.goles_visitante : "-"}
                      </div>
                      <span className="font-bold text-sm text-left w-20 truncate">{partido.equipo_visitante}</span>
                    </div>

                    {pron ? (
                      <div className="bg-slate-800 px-4 py-2 rounded-lg flex items-center justify-between w-full border border-slate-700/50">
                        <span className="text-slate-400 text-xs">
                          Apostó:{" "}
                          <strong className="text-slate-200">
                            {pron.prediccion_local} a {pron.prediccion_visitante}
                          </strong>
                        </span>
                        {hayResultado && (
                          <span
                            className={`text-[11px] font-bold px-2 py-1 rounded-md ${
                              pts === 6
                                ? "bg-emerald-500/20 text-emerald-400"
                                : pts === 3
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-slate-700 text-slate-400"
                            }`}
                          >
                            +{pts} pts
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-800/50 px-4 py-2 rounded-lg flex items-center justify-center w-full border border-slate-700/30">
                        <span className="text-slate-500 text-xs italic">No cargó pronóstico para este partido.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}