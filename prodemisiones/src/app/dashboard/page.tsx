"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, CheckCircle2, Lock, Trophy, CalendarDays, Ticket } from "lucide-react";
import Image from "next/image";

type Partido = { id: number; equipo_local: string; equipo_visitante: string; fecha_hora: string; goles_local: number | null; goles_visitante: number | null; jornada_id: number; };
type Jornada = { id: number; nombre: string; estado: string; };
type Posicion = { usuario_id: string; usuario_nombre: string; puntos: number; };
type EstadoPronostico = { id?: number; local: string; visitante: string; puntos_obtenidos: number; guardado: boolean; };

export default function Dashboard() {
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState<number | null>(null);
  const [estaInscripto, setEstaInscripto] = useState(false);
  const [cargandoInscripcion, setCargandoInscripcion] = useState(false);

  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [predicciones, setPredicciones] = useState<Record<number, EstadoPronostico>>({});
  
  const [rankingGlobal, setRankingGlobal] = useState<Posicion[]>([]);
  const [rankingJornada, setRankingJornada] = useState<Posicion[]>([]);
  const [tabRanking, setTabRanking] = useState<'jornada' | 'global'>('jornada');
  
  const [ahora, setAhora] = useState<Date | null>(null);
  const router = useRouter();

  useEffect(() => {
    setAhora(new Date());
    const interval = setInterval(() => setAhora(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const inicializar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
      setUserName(user.user_metadata?.nombre || user.email?.split('@')[0] || "Jugador");

      const { data: dataJornadas } = await supabase.from('jornadas').select('*').order('id', { ascending: false });
      if (dataJornadas && dataJornadas.length > 0) {
        setJornadas(dataJornadas);
        const activa = dataJornadas.find(j => j.estado === 'abierta') || dataJornadas[0];
        setJornadaSeleccionada(activa.id);
      }
    };
    inicializar();
  }, [router]);

  useEffect(() => {
    if (!userId || !jornadaSeleccionada) return;

    const cargarDatosJornada = async () => {
      const { data: inscripcion } = await supabase.from('inscripciones').select('*').eq('usuario_id', userId).eq('jornada_id', jornadaSeleccionada).single();
      setEstaInscripto(!!inscripcion);

      const { data: dataPartidos } = await supabase.from('partidos').select('*').eq('jornada_id', jornadaSeleccionada).order('fecha_hora', { ascending: true });
      if (dataPartidos) setPartidos(dataPartidos);

      const { data: pronosticosUsuario } = await supabase.from('pronosticos').select('*').eq('usuario_id', userId);
      if (pronosticosUsuario) {
        const estadoLocal: Record<number, EstadoPronostico> = {};
        pronosticosUsuario.forEach(p => {
          estadoLocal[p.partido_id] = { id: p.id, local: p.prediccion_local.toString(), visitante: p.prediccion_visitante.toString(), puntos_obtenidos: p.puntos_obtenidos || 0, guardado: true };
        });
        setPredicciones(estadoLocal);
      }

      const { data: todosLosPronosticos } = await supabase.from('pronosticos').select('usuario_id, usuario_alias, puntos_obtenidos, partido_id, partidos!inner(jornada_id)');
      
      if (todosLosPronosticos) {
        const mapGlobal = new Map<string, Posicion>();
        const mapJornada = new Map<string, Posicion>();

        // CORRECCIÓN: Agregamos "(p: any)" para evitar el falso error de TypeScript
        todosLosPronosticos.forEach((p: any) => {
          const uId = p.usuario_id || p.usuario_alias;
          const alias = p.usuario_alias || 'Anónimo';
          const pts = p.puntos_obtenidos || 0;

          if (!mapGlobal.has(uId)) mapGlobal.set(uId, { usuario_id: uId, usuario_nombre: alias, puntos: 0 });
          mapGlobal.get(uId)!.puntos += pts;

          // CORRECCIÓN: Manejo dinámico para leer el dato independientemente de cómo lo mande Supabase
          const idJor = Array.isArray(p.partidos) ? p.partidos[0]?.jornada_id : p.partidos?.jornada_id;

          if (idJor === jornadaSeleccionada) {
            if (!mapJornada.has(uId)) mapJornada.set(uId, { usuario_id: uId, usuario_nombre: alias, puntos: 0 });
            mapJornada.get(uId)!.puntos += pts;
          }
        });

        setRankingGlobal(Array.from(mapGlobal.values()).sort((a, b) => b.puntos - a.puntos));
        setRankingJornada(Array.from(mapJornada.values()).sort((a, b) => b.puntos - a.puntos));
      }
    };
    cargarDatosJornada();
  }, [userId, jornadaSeleccionada]);

  const handleInscribirse = async () => {
    if (!jornadaSeleccionada) return;
    setCargandoInscripcion(true);
    const { error } = await supabase.from('inscripciones').insert([{ usuario_id: userId, jornada_id: jornadaSeleccionada }]);
    if (!error) {
      setEstaInscripto(true);
    } else {
      alert("Error al inscribirse. Intentá nuevamente.");
    }
    setCargandoInscripcion(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const guardarPronostico = async (partidoId: number) => {
    const pred = predicciones[partidoId];
    if (!pred?.local || !pred?.visitante) return alert("Completá ambos goles.");

    const datos = {
      usuario_id: userId,
      usuario_alias: userName,
      partido_id: partidoId,
      prediccion_local: parseInt(pred.local),
      prediccion_visitante: parseInt(pred.visitante)
    };

    if (pred.id) {
      await supabase.from('pronosticos').update(datos).eq('id', pred.id);
    } else {
      const { data } = await supabase.from('pronosticos').insert([datos]).select().single();
      if (data) pred.id = data.id;
    }
    
    setPredicciones({ ...predicciones, [partidoId]: { ...pred, guardado: true } });
  };

  const partidosActivos = partidos.filter(p => ahora && new Date(p.fecha_hora) > ahora);
  const partidosFinalizados = partidos.filter(p => ahora && new Date(p.fecha_hora) <= ahora);

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6 pb-20">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl gap-4">
          <div className="flex items-center gap-4">
            <Image src="/logo.jpg" alt="Logo" width={60} height={60} className="rounded-lg shadow-md" />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">PRODE <span className="text-emerald-400">MISIONES</span></h1>
              <p className="text-slate-400 mt-1 flex items-center gap-2">Hola, {userName} <Link href="/configuracion"><Settings className="w-4 h-4 text-slate-500 hover:text-emerald-400 transition-colors" /></Link></p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/reglas" className="bg-slate-700 hover:bg-emerald-500 text-slate-200 hover:text-slate-900 px-4 py-2 rounded-lg transition-colors text-sm font-bold border border-slate-600">Reglas</Link>
            <button onClick={handleLogout} className="bg-slate-700 hover:bg-red-500 text-slate-200 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm font-bold border border-slate-600 hover:border-red-500">Salir</button>
          </div>
        </header>

        {jornadas.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
            <CalendarDays className="w-6 h-6 text-emerald-400" />
            <select 
              className="bg-slate-900 border border-slate-600 rounded-lg text-white font-bold py-2 px-4 focus:outline-none focus:border-emerald-500"
              value={jornadaSeleccionada || ''}
              onChange={(e) => setJornadaSeleccionada(parseInt(e.target.value))}
            >
              {jornadas.map(j => (
                <option key={j.id} value={j.id}>{j.nombre} {j.estado === 'cerrada' ? '(Finalizada)' : ''}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6">
            {!estaInscripto && jornadaSeleccionada ? (
              <div className="bg-amber-500/10 border border-amber-500 p-6 rounded-2xl shadow-lg text-center flex flex-col items-center">
                <Ticket className="w-12 h-12 text-amber-500 mb-3" />
                <h2 className="text-xl font-bold text-amber-500 mb-2">¡Asegurá tu lugar en esta fecha!</h2>
                <p className="text-sm text-slate-300 mb-6">Para poder pronosticar y participar por el pozo de esta jornada, necesitás acreditar tu poroto.</p>
                <button 
                  onClick={handleInscribirse}
                  disabled={cargandoInscripcion}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-8 rounded-xl transition-colors shadow-lg disabled:opacity-50"
                >
                  {cargandoInscripcion ? "Procesando..." : "Acreditar mi poroto"}
                </button>
              </div>
            ) : (
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-emerald-400">Partidos para Pronosticar</h2>
                {partidosActivos.length === 0 ? (
                  <p className="text-slate-400 text-sm">No hay partidos disponibles para apostar en este momento.</p>
                ) : (
                  <ul className="space-y-4">
                    {partidosActivos.map((partido) => {
                      const pred = predicciones[partido.id] || { local: '', visitante: '', guardado: false, puntos_obtenidos: 0 };
                      return (
                        <li key={partido.id} className={`bg-slate-900 p-4 rounded-xl border transition-all ${pred.guardado ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-slate-700'}`}>
                          <div className="text-center w-full border-b border-slate-800 pb-2 mb-3">
                             <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest block">{new Date(partido.fecha_hora).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="font-bold text-sm text-center w-24 truncate">{partido.equipo_local}</span>
                            <div className="flex items-center gap-2">
                              <input type="number" min="0" disabled={pred.guardado} value={pred.local} onChange={(e) => setPredicciones({ ...predicciones, [partido.id]: { ...pred, local: e.target.value, guardado: false } })} className="w-10 h-10 bg-slate-800 border-2 border-slate-600 rounded-lg text-center font-bold text-lg disabled:opacity-50 focus:border-emerald-500 focus:outline-none" />
                              <span className="text-slate-500 font-bold">-</span>
                              <input type="number" min="0" disabled={pred.guardado} value={pred.visitante} onChange={(e) => setPredicciones({ ...predicciones, [partido.id]: { ...pred, visitante: e.target.value, guardado: false } })} className="w-10 h-10 bg-slate-800 border-2 border-slate-600 rounded-lg text-center font-bold text-lg disabled:opacity-50 focus:border-emerald-500 focus:outline-none" />
                            </div>
                            <span className="font-bold text-sm text-center w-24 truncate">{partido.equipo_visitante}</span>
                          </div>

                          <div className="mt-4 flex justify-center">
                            {pred.guardado ? (
                              <button onClick={() => setPredicciones({ ...predicciones, [partido.id]: { ...pred, guardado: false } })} className="flex items-center text-xs font-bold text-slate-400 bg-slate-800 px-4 py-2 rounded-lg hover:text-white hover:bg-slate-700 transition-colors border border-slate-700">
                                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500" /> Pronóstico Listo (Editar)
                              </button>
                            ) : (
                              <button onClick={() => guardarPronostico(partido.id)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm shadow-lg">Guardar</button>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}

            {partidosFinalizados.length > 0 && (
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-slate-400 flex items-center gap-2"><Lock className="w-5 h-5" /> Partidos Bloqueados (En Juego / Finalizados)</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {partidosFinalizados.map((partido) => {
                    const pred = predicciones[partido.id];
                    return (
                      <div key={partido.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col items-center opacity-80 relative overflow-hidden">
                        {pred?.guardado && (
                          <div className={`absolute top-0 right-0 px-2 py-1 text-[10px] font-bold rounded-bl-lg ${pred.puntos_obtenidos === 6 ? 'bg-emerald-500 text-slate-900' : pred.puntos_obtenidos === 3 ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
                            {pred.puntos_obtenidos} pts
                          </div>
                        )}
                        <span className="text-[10px] text-red-400 font-bold mb-2 uppercase tracking-wider">Tiempo Expirado</span>
                        <div className="flex items-center justify-center gap-2 w-full mb-2">
                          <span className="font-bold text-xs text-right w-16 truncate">{partido.equipo_local}</span>
                          <div className="w-6 h-6 bg-slate-800 border border-slate-700 flex items-center justify-center rounded text-slate-500 font-bold text-xs">{pred?.local || '-'}</div>
                          <span className="text-slate-600 font-bold text-xs">-</span>
                          <div className="w-6 h-6 bg-slate-800 border border-slate-700 flex items-center justify-center rounded text-slate-500 font-bold text-xs">{pred?.visitante || '-'}</div>
                          <span className="font-bold text-xs text-left w-16 truncate">{partido.equipo_visitante}</span>
                        </div>
                        {partido.goles_local !== null && (
                          <span className="text-[10px] text-emerald-400 font-bold mt-1">Resultado Real: {partido.goles_local} - {partido.goles_visitante}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg h-fit">
            <h2 className="text-xl font-bold mb-4 text-emerald-400 flex items-center gap-2"><Trophy className="w-5 h-5"/> Tabla de Posiciones</h2>
            
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 mb-4">
              <button onClick={() => setTabRanking('jornada')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${tabRanking === 'jornada' ? 'bg-emerald-500 text-slate-900 shadow' : 'text-slate-400 hover:text-white'}`}>Esta Fecha</button>
              <button onClick={() => setTabRanking('global')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${tabRanking === 'global' ? 'bg-emerald-500 text-slate-900 shadow' : 'text-slate-400 hover:text-white'}`}>Global</button>
            </div>

            {(() => {
              const rankingActual = tabRanking === 'jornada' ? rankingJornada : rankingGlobal;
              if (rankingActual.length === 0) return <p className="text-slate-400 text-sm text-center py-4">Aún no hay puntos registrados.</p>;
              
              return (
                <ul className="space-y-3">
                  {rankingActual.map((pos, index) => (
                    <Link href={`/jugador/${pos.usuario_id}`} key={pos.usuario_id}>
                      <li className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700 hover:bg-slate-800/80 cursor-pointer transition-colors mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`font-bold w-6 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-slate-500'}`}>{index + 1}°</span>
                          <span className="text-sm font-medium hover:text-emerald-400 transition-colors">{pos.usuario_nombre}</span>
                        </div>
                        <span className="font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full text-sm">{pos.puntos} pts</span>
                      </li>
                    </Link>
                  ))}
                </ul>
              );
            })()}
          </div>
        </div>
      </div>
    </main>
  );
}