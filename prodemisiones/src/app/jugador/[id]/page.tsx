"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";
import { ArrowLeft, Trophy, History } from "lucide-react";

type FilaPerfil = {
  usuario_nombre: string;
  partido_id: number | null;
  equipo_local: string | null;
  equipo_visitante: string | null;
  fecha_hora: string | null;
  goles_local: number | null;
  goles_visitante: number | null;
  prediccion_local: number | null;
  prediccion_visitante: number | null;
  puntos_obtenidos: number;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function PerfilContenido() {
  const params = useParams();
  const router = useRouter();
  const rawId = typeof params?.id === "string" ? params.id : "";

  const [nombreJugador, setNombreJugador] = useState<string>("");
  const [partidos, setPartidos] = useState<FilaPerfil[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [noEncontrado, setNoEncontrado] = useState<boolean>(false);

  useEffect(() => {
    let activo = true;

    const cargarPerfil = async () => {
      if (!UUID_REGEX.test(rawId)) {
        if (activo) {
          setNoEncontrado(true);
          setCargando(false);
        }
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase.rpc("obtener_perfil_jugador", {
        p_usuario_id: rawId,
      });

      if (!activo) return;

      if (error || !data || data.length === 0) {
        setNoEncontrado(true);
      } else {
        const filas = data as FilaPerfil[];
        setNombreJugador(filas[0].usuario_nombre);
        setPartidos(filas.filter((f) => f.partido_id !== null));
      }

      setCargando(false);
    };

    cargarPerfil();

    return () => {
      activo = false;
    };
  }, [rawId, router]);

  const puntosVisibles = partidos.reduce(
    (acc, p) => acc + (p.puntos_obtenidos || 0),
    0
  );

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-slate-400 animate-pulse font-semibold">
          Cargando historial del jugador...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-slate-300 hover:text-white bg-slate-800 px-4 py-2 rounded-lg text-sm font-bold border border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Posiciones
        </Link>
      </div>

      {noEncontrado ? (
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center">
          <h1 className="text-xl font-bold text-white mb-2">
            Jugador no encontrado
          </h1>
          <p className="text-slate-400 text-sm">
            El perfil solicitado no existe o no está disponible.
          </p>
        </div>
      ) : (
        <>
          <header className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
                Historial Público
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {nombreJugador}
              </h1>
            </div>
            <div className="bg-slate-900 px-5 py-3 rounded-xl border border-emerald-500/30 flex items-center gap-3">
              <Trophy className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="text-xs text-slate-400">Puntos (últimos 30)</p>
                <p className="text-xl font-extrabold text-emerald-400">
                  {puntosVisibles} pts
                </p>
              </div>
            </div>
          </header>

          <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-400" /> Pronósticos en
              partidos iniciados
            </h2>

            {partidos.length === 0 ? (
              <p className="text-slate-400 text-sm">
                Todavía no hay partidos iniciados para mostrar.
              </p>
            ) : (
              <ul className="space-y-3">
                {partidos.map((p) => {
                  const finalizado =
                    p.goles_local !== null && p.goles_visitante !== null;
                  const jugo =
                    p.prediccion_local !== null &&
                    p.prediccion_visitante !== null;

                  return (
                    <li
                      key={p.partido_id}
                      className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3"
                    >
                      <div className="text-center sm:text-left">
                        <p className="text-[11px] text-slate-500 mb-1">
                          {p.fecha_hora
                            ? new Date(p.fecha_hora).toLocaleDateString(
                                "es-AR",
                                {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : ""}
                        </p>
                        <p className="font-bold text-sm text-white">
                          {p.equipo_local}{" "}
                          <span className="text-emerald-400 mx-1">
                            {finalizado
                              ? `${p.goles_local} - ${p.goles_visitante}`
                              : "vs"}
                          </span>{" "}
                          {p.equipo_visitante}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                          Jugó:{" "}
                          <strong className="text-white">
                            {jugo
                              ? `${p.prediccion_local} - ${p.prediccion_visitante}`
                              : "Sin pronóstico"}
                          </strong>
                        </span>

                        {finalizado && jugo && (
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              p.puntos_obtenidos === 6
                                ? "bg-emerald-500/20 text-emerald-400"
                                : p.puntos_obtenidos === 3
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-slate-700 text-slate-400"
                            }`}
                          >
                            +{p.puntos_obtenidos} pts
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default function PerfilJugador() {
  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 pb-20">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <p className="text-slate-400 animate-pulse font-semibold">
              Cargando historial del jugador...
            </p>
          </div>
        }
      >
        <PerfilContenido />
      </Suspense>
    </main>
  );
}