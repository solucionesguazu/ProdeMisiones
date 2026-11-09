"use client";

import { useEffect, useState, Suspense } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";

// 1. COMPONENTE INTERNO (Usa useParams)
function PerfilContenido() {
  const params = useParams<{ id: string }>();
  const idJugador = params?.id ? decodeURIComponent(String(params.id)).trim() : "";
  
  const [nombreJugador, setNombreJugador] = useState("Jugador");
  const [pronosticos, setPronosticos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!idJugador) return;

    const cargarDatos = async () => {
      const ahora = new Date().toISOString();
      
      const { data } = await supabase
        .from('pronosticos')
        .select(`
          *,
          partidos!inner (
            id, equipo_local, equipo_visitante, fecha_hora, goles_local, goles_visitante
          )
        `)
        .or(`usuario_id.eq.${idJugador},usuario_alias.eq.${idJugador}`)
        .lt('partidos.fecha_hora', ahora);

      if (data) {
        setPronosticos(data);
        if (data.length > 0) {
          setNombreJugador(data[0].usuario_alias || "Jugador");
        }
      }
      setCargando(false);
    };

    cargarDatos();
  }, [idJugador]);

  if (cargando) {
    return <div className="text-emerald-400 text-center py-10 font-bold">Cargando datos del jugador...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors font-bold">
        <ArrowLeft className="w-5 h-5 mr-2" /> Volver al panel
      </Link>
      
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl mb-6 flex items-center gap-4">
        <div className="bg-emerald-500/20 p-4 rounded-full">
          <User className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Perfil de {nombreJugador}</h1>
          <p className="text-slate-400 text-sm">Historial de pronósticos en partidos finalizados</p>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        {pronosticos.length === 0 ? (
          <p className="text-slate-400 text-center py-6">Este jugador aún no tiene pronósticos en partidos finalizados.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pronosticos.map((p: any) => (
              <div key={p.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col relative overflow-hidden">
                <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-lg ${p.puntos_obtenidos === 6 ? 'bg-emerald-500 text-slate-900' : p.puntos_obtenidos === 3 ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
                  {p.puntos_obtenidos} pts
                </div>
                
                <span className="text-xs text-slate-500 mb-2 mt-2">
                  {new Date(p.partidos.fecha_hora).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                
                <div className="flex items-center justify-between w-full mb-3">
                   <span className="font-bold text-sm truncate flex-1 text-right">{p.partidos.equipo_local}</span>
                   <div className="flex items-center gap-2 mx-3">
                     <span className="w-6 text-center font-bold text-emerald-400">{p.prediccion_local}</span>
                     <span className="text-slate-600">-</span>
                     <span className="w-6 text-center font-bold text-emerald-400">{p.prediccion_visitante}</span>
                   </div>
                   <span className="font-bold text-sm truncate flex-1 text-left">{p.partidos.equipo_visitante}</span>
                </div>
                <div className="text-center w-full border-t border-slate-800 pt-2">
                   <span className="text-xs text-slate-400">Resultado real: {p.partidos.goles_local ?? '-'} - {p.partidos.goles_visitante ?? '-'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 2. COMPONENTE PRINCIPAL (Envuelve en Suspense)
export default function PerfilJugador() {
  return (
    <main className="min-h-screen bg-slate-900 text-white p-6">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-emerald-400 font-bold">Cargando perfil...</p>
        </div>
      }>
        <PerfilContenido />
      </Suspense>
    </main>
  );
}