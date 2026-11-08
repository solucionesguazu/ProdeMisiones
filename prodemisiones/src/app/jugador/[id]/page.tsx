"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Link from "next/link";
import { ArrowLeft, User, History } from "lucide-react";

type Partido = {
  id: number;
  equipo_local: string;
  equipo_visitante: string;
  fecha_hora: string;
  goles_local: number | null;
  goles_visitante: number | null;
};

type PronosticoPublico = {
  partido_id: number;
  prediccion_local: number;
  prediccion_visitante: number;
  puntos_obtenidos: number;
  usuario_alias: string;
  usuario_id?: string;
};

export default function PerfilJugador({ params }: { params: { id: string } }) {
  // 1. Decodificamos la URL y limpiamos espacios invisibles
  const idJugador = decodeURIComponent(params.id).trim();
  
  const [nombreJugador, setNombreJugador] = useState<string>("Jugador");
  const [partidosFinalizados, setPartidosFinalizados] = useState<Partido[]>([]);
  const [pronosticos, setPronosticos] = useState<Record<number, PronosticoPublico>>({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: todosPartidos } = await supabase
        .from('partidos')
        .select('*');

      if (!todosPartidos) {
        setCargando(false);
        return;
      }

      const ahora = new Date();
      const finalizados = todosPartidos
        .filter(p => new Date(p.fecha_hora) <= ahora)
        .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());

      setPartidosFinalizados(finalizados);

      const { data: pronosticosTotales } = await supabase
        .from('pronosticos')
        .select('*');

      if (pronosticosTotales) {
        // 2. Forzamos que la comparación sea estrictamente en texto y sin espacios para evitar errores de lectura
        const pronosticosJugador = pronosticosTotales.filter(p => {
          const idDB = p.usuario_id ? String(p.usuario_id).trim() : "";
          const aliasDB = p.usuario_alias ? String(p.usuario_alias).trim() : "";
          const idBuscado = String(idJugador);
          
          return idDB === idBuscado || aliasDB === idBuscado;
        });

        if (pronosticosJugador.length > 0) {
            setNombreJugador(pronosticosJugador[0].usuario_alias || "Jugador");
            
            const diccionarioPronosticos: Record<number, PronosticoPublico> = {};
            pronosticosJugador.forEach(p => {
              diccionarioPronosticos[p.partido_id] = p;
            });
            setPronosticos(diccionarioPronosticos);
        }
      }

      setCargando(false);
    };

    cargarDatos();
  }, [idJugador]);

  const formatFecha = (fechaString: string) => {
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return new Date(fechaString).toLocaleDateString('es-AR', opciones);
  };

  const totalPuntos = Object.values(pronosticos).reduce((acc, curr) => acc + (curr.puntos_obtenidos || 0), 0);

  if (cargando) {
    return <main className="min-h-screen bg-slate-900 flex items-center justify-center text-emerald-400 font-bold">Cargando estadísticas...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6 pb-20 relative">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl gap-4">
           <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500">
               <User className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Historial de pronósticos de</p>
              <h1 className="text-3xl font-extrabold text-white">
                {nombreJugador}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-emerald-500/10 border border-emerald-500/30 px-6 py-2 rounded-xl text-center">
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Puntos Totales</p>
                <p className="text-2xl font-black text-white">{totalPuntos}</p>
             </div>
             <Link href="/dashboard" className="flex items-center text-slate-300 hover:text-white transition-colors bg-slate-700 px-4 py-3 rounded-lg text-sm font-bold border border-slate-600 h-full">
               <ArrowLeft className="w-4 h-4 mr-2" /> Volver
             </Link>
          </div>
        </header>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
           <h2 className="text-xl font-bold mb-6 text-emerald-400 flex items-center gap-2">
              <History className="w-5 h-5"/> Partidos Finalizados
           </h2>

           {partidosFinalizados.length === 0 ? (
             <p className="text-slate-400 text-sm text-center py-8">Todavía no hay partidos finalizados para analizar.</p>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {partidosFinalizados.map((partido) => {
                  const resultadoOficial = partido.goles_local !== null && partido.goles_visitante !== null;
                  const pronosticoJugador = pronosticos[partido.id];

                  return (
                    <div key={partido.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col items-center">
                      <span className="text-xs text-slate-400 mb-3">{formatFecha(partido.fecha_hora)}</span>
                      
                      <div className="flex items-center justify-center gap-2 w-full mb-4">
                         <span className="font-bold text-sm text-right w-20 truncate">{partido.equipo_local}</span>
                         <div className={`w-8 h-8 flex items-center justify-center rounded font-bold text-sm ${resultadoOficial ? 'bg-emerald-900 border-emerald-700 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                            {resultadoOficial ? partido.goles_local : '-'}
                         </div>
                         <span className="text-slate-600 font-bold">-</span>
                         <div className={`w-8 h-8 flex items-center justify-center rounded font-bold text-sm ${resultadoOficial ? 'bg-emerald-900 border-emerald-700 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                            {resultadoOficial ? partido.goles_visitante : '-'}
                         </div>
                         <span className="font-bold text-sm text-left w-20 truncate">{partido.equipo_visitante}</span>
                      </div>
                      
                      {pronosticoJugador ? (
                        <div className="bg-slate-800 px-4 py-2 rounded-lg flex items-center justify-between w-full border border-slate-700/50">
                          <span className="text-slate-400 text-xs">Apostó: <strong className="text-slate-200">{pronosticoJugador.prediccion_local} a {pronosticoJugador.prediccion_visitante}</strong></span>
                          {resultadoOficial && (
                            <span className={`text-[11px] font-bold px-2 py-1 rounded-md ${pronosticoJugador.puntos_obtenidos === 6 ? 'bg-emerald-500/20 text-emerald-400' : pronosticoJugador.puntos_obtenidos === 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                              +{pronosticoJugador.puntos_obtenidos} pts
                            </span>
                          )}
                        </div>
                      ) : (
                         <div className="bg-slate-800/50 px-4 py-2 rounded-lg flex items-center justify-center w-full border border-slate-700/30">
                            <span className="text-slate-500 text-xs italic">No cargó pronóstico para este partido.</span>
                         </div>
                      )}
                    </div>
                  )
                })}
             </div>
           )}
        </div>
      </div>
    </main>
  );
}