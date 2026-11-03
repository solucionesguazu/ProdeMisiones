"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, CheckCircle2, Edit2, History } from "lucide-react";
import Image from "next/image";

type Partido = {
  id: number;
  equipo_local: string;
  equipo_visitante: string;
  fecha_hora: string;
  goles_local: number | null;
  goles_visitante: number | null;
};

type Posicion = {
  usuario: string;
  puntos: number;
};

type EstadoPronostico = {
  local: string;
  visitante: string;
  guardado: boolean;
};

export default function Dashboard() {
  const [userName, setUserName] = useState<string>("");
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [predicciones, setPredicciones] = useState<Record<number, EstadoPronostico>>({});
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkUserAndLoadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const nombre = user.user_metadata?.nombre || user.email?.split('@')[0] || "Jugador";
        setUserName(nombre);
        
        const { data: partidosData } = await supabase
          .from('partidos')
          .select('*')
          .order('fecha_hora', { ascending: true });

        if (partidosData) setPartidos(partidosData);

        const { data: pronosticosData } = await supabase
          .from('pronosticos')
          .select('usuario_alias, puntos_obtenidos, partido_id, prediccion_local, prediccion_visitante');

        if (pronosticosData) {
          const ranking: Record<string, number> = {};
          pronosticosData.forEach(p => {
            const alias = p.usuario_alias || 'Anónimo';
            if (!ranking[alias]) ranking[alias] = 0;
            ranking[alias] += p.puntos_obtenidos || 0;
          });
          
          const rankingArray = Object.entries(ranking)
            .map(([usuario, puntos]) => ({ usuario, puntos }))
            .sort((a, b) => b.puntos - a.puntos);
            
          setPosiciones(rankingArray);

          const misPronosticos = pronosticosData.filter(p => p.usuario_alias === nombre);
          const estadoInicial: Record<number, EstadoPronostico> = {};
          
          misPronosticos.forEach(p => {
             estadoInicial[p.partido_id] = {
               local: p.prediccion_local.toString(),
               visitante: p.prediccion_visitante.toString(),
               guardado: true 
             };
          });
          setPredicciones(estadoInicial);
        }
      } else {
        router.push("/login"); 
      }
    };
    
    checkUserAndLoadData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleInputChange = (partidoId: number, equipo: 'local' | 'visitante', valor: string) => {
    setPredicciones(prev => ({
      ...prev,
      [partidoId]: {
        ...prev[partidoId],
        [equipo]: valor,
        guardado: false 
      }
    }));
  };

  const habilitarEdicion = (partidoId: number) => {
    setPredicciones(prev => ({
      ...prev,
      [partidoId]: {
        ...prev[partidoId],
        guardado: false 
      }
    }));
  };

  const guardarPronostico = async (partidoId: number) => {
    const prediccion = predicciones[partidoId];
    if (!prediccion?.local || !prediccion?.visitante) {
      alert("Por favor completá ambos goles antes de guardar.");
      return;
    }

    const { data: existente } = await supabase
      .from('pronosticos')
      .select('id')
      .eq('usuario_alias', userName)
      .eq('partido_id', partidoId)
      .single();

    let errorG;

    if (existente) {
      const { error } = await supabase
        .from('pronosticos')
        .update({ 
          prediccion_local: parseInt(prediccion.local),
          prediccion_visitante: parseInt(prediccion.visitante)
        })
        .eq('id', existente.id);
        errorG = error;
    } else {
      const { error } = await supabase
        .from('pronosticos')
        .insert([
          { 
            usuario_alias: userName,
            partido_id: partidoId,
            prediccion_local: parseInt(prediccion.local),
            prediccion_visitante: parseInt(prediccion.visitante),
            puntos_obtenidos: 0
          }
        ]);
        errorG = error;
    }

    if (errorG) {
      alert("Error al guardar: " + errorG.message);
    } else {
      setPredicciones(prev => ({
        ...prev,
        [partidoId]: { ...prev[partidoId], guardado: true }
      }));
    }
  };

  const formatFecha = (fechaString: string) => {
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return new Date(fechaString).toLocaleDateString('es-AR', opciones);
  };

  const ahora = new Date();
  const partidosActivos = partidos.filter(p => new Date(p.fecha_hora) > ahora);
  
  const partidosFinalizados = partidos
    .filter(p => new Date(p.fecha_hora) <= ahora)
    .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime())
    .slice(0, 20);

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-10 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl gap-4">
           <div className="flex items-center gap-4">
            <Image src="/logo.jpg" alt="Logo Prode Misiones" width={64} height={64} className="rounded-lg shadow-md" />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                PRODE <span className="text-emerald-400">MISIONES</span>
              </h1>
              <p className="text-slate-400 mt-1">Hola, {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/configuracion" className="p-2 text-slate-400 hover:text-emerald-400 transition-colors" title="Configuración de Perfil">
              <Settings className="w-6 h-6"/>
            </Link>
            <Link href="/reglas" className="bg-slate-700 hover:bg-emerald-500 text-slate-200 hover:text-slate-900 px-4 py-2 rounded-lg transition-colors text-sm font-bold border border-slate-600 hover:border-emerald-500">
              Ver Reglas
            </Link>
            <button onClick={handleLogout} className="bg-slate-700 hover:bg-red-500 text-slate-200 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm font-bold border border-slate-600 hover:border-red-500">
              Cerrar Sesión
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg h-fit">
            <h2 className="text-xl font-bold mb-4 text-emerald-400">Próximos Partidos</h2>
            {partidosActivos.length === 0 ? (
              <p className="text-slate-400 text-sm">No hay partidos pendientes.</p>
            ) : (
              <ul className="space-y-4">
                {partidosActivos.map((partido) => {
                   const estaGuardado = predicciones[partido.id]?.guardado;
                   return (
                  <li key={partido.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col items-center">
                     <span className="text-xs text-slate-400 mb-3">{formatFecha(partido.fecha_hora)}</span>
                     <div className="flex items-center justify-center gap-3 w-full mb-3">
                        <span className="font-bold text-lg text-right w-24 truncate">{partido.equipo_local}</span>
                        <input 
                          type="number" min="0" disabled={estaGuardado}
                          className="w-12 h-10 bg-slate-800 border border-slate-600 rounded text-center font-bold focus:border-emerald-500 focus:outline-none disabled:opacity-50 disabled:bg-slate-700"
                          value={predicciones[partido.id]?.local || ''}
                          onChange={(e) => handleInputChange(partido.id, 'local', e.target.value)}
                        />
                        <span className="text-slate-500 font-bold px-1">-</span>
                        <input 
                          type="number" min="0" disabled={estaGuardado}
                          className="w-12 h-10 bg-slate-800 border border-slate-600 rounded text-center font-bold focus:border-emerald-500 focus:outline-none disabled:opacity-50 disabled:bg-slate-700"
                          value={predicciones[partido.id]?.visitante || ''}
                          onChange={(e) => handleInputChange(partido.id, 'visitante', e.target.value)}
                        />
                        <span className="font-bold text-lg text-left w-24 truncate">{partido.equipo_visitante}</span>
                     </div>
                     {estaGuardado ? (
                       <button onClick={() => habilitarEdicion(partido.id)} className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-bold py-2 rounded transition-colors flex items-center justify-center gap-2">
                         <CheckCircle2 className="w-4 h-4 text-emerald-400"/> Pronóstico Listo (Editar)
                       </button>
                     ) : (
                       <button onClick={() => guardarPronostico(partido.id)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-2 rounded transition-colors flex items-center justify-center gap-2">
                          <Edit2 className="w-4 h-4"/> Guardar Predicción
                       </button>
                     )}
                  </li>
                )})}
              </ul>
            )}
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg h-fit">
            <h2 className="text-xl font-bold mb-4 text-emerald-400">Tabla de Posiciones</h2>
            {posiciones.length === 0 ? (
              <p className="text-slate-400 text-sm">Todavía no hay puntajes registrados.</p>
            ) : (
              <ul className="space-y-3">
                {posiciones.map((pos, index) => (
                  <li key={pos.usuario} className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3">
                      <span className={`font-bold w-6 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                        {index + 1}°
                      </span>
                      <span className="text-sm font-medium">{pos.usuario}</span>
                    </div>
                    <span className="font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full text-sm">
                      {pos.puntos} pts
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {partidosFinalizados.length > 0 && (
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg mt-6">
            <h2 className="text-xl font-bold mb-4 text-slate-300 flex items-center gap-2">
               <History className="w-5 h-5 text-emerald-500"/> Últimos 20 Partidos Finalizados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {partidosFinalizados.map((partido) => {
                const resultadoOficial = partido.goles_local !== null && partido.goles_visitante !== null;
                const miPronostico = predicciones[partido.id];

                return (
                <div key={partido.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col items-center">
                  <span className="text-xs text-slate-400 mb-3">{formatFecha(partido.fecha_hora)}</span>
                  
                  <div className="flex items-center justify-center gap-2 w-full mb-3">
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
                  
                  <div className="bg-slate-800 px-3 py-1 rounded-full flex items-center gap-2 text-xs w-full justify-center">
                    <span className="text-slate-400">Tu pronóstico:</span>
                    <span className="font-bold text-slate-200">
                      {miPronostico?.local || '-'} a {miPronostico?.visitante || '-'}
                    </span>
                  </div>

                  {!resultadoOficial && (
                    <span className="text-[10px] text-amber-500 mt-2 font-medium">Falta cargar resultado real</span>
                  )}
                </div>
              )})}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}