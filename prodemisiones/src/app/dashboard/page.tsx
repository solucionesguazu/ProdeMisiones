"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, CheckCircle2, Edit2, History, Lock, ShieldAlert, Trophy, Calendar } from "lucide-react";
import Image from "next/image";

type Jornada = { id: number; nombre: string; activa: boolean; estado: string; };
type Inscripcion = { id: number; usuario_id: string; jornada_id: number; pagado: boolean; };

type Partido = {
  id: number;
  equipo_local: string;
  equipo_visitante: string;
  fecha_hora: string;
  jornada_id: number;
  goles_local: number | null;
  goles_visitante: number | null;
};

type Posicion = {
  usuario_id: string;
  usuario_nombre: string;
  puntos: number;
};

type EstadoPronostico = {
  local: string;
  visitante: string;
  puntos_obtenidos: number;
  guardado: boolean;
};

export default function Dashboard() {
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState<Jornada | null>(null);
  const [inscripcion, setInscripcion] = useState<Inscripcion | null>(null);
  const [solicitandoInscripcion, setSolicitandoInscripcion] = useState(false);

  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [predicciones, setPredicciones] = useState<Record<number, EstadoPronostico>>({});
  
  const [rankingGlobal, setRankingGlobal] = useState<Posicion[]>([]);
  const [rankingJornada, setRankingJornada] = useState<Posicion[]>([]);
  const [tabRanking, setTabRanking] = useState<'fecha' | 'global'>('fecha');

  const [ahora, setAhora] = useState<Date | null>(null);
  const [mostrarBienvenida, setMostrarBienvenida] = useState(false);
  const [guardando, setGuardando] = useState<number | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    setAhora(new Date());
    const interval = setInterval(() => setAhora(new Date()), 60000); // Actualiza reloj cada minuto
    
    const bienvenidaVisto = localStorage.getItem("bienvenida_prode");
    if (!bienvenidaVisto) {
      setMostrarBienvenida(true);
      localStorage.setItem("bienvenida_prode", "true");
    }

    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
      const nombre = user.user_metadata?.nombre || user.email?.split('@')[0] || "Jugador";
      setUserName(nombre);

      // 1. Cargar Jornadas
      const { data: dataJornadas } = await supabase.from('jornadas').select('*').order('id', { ascending: false });
      if (dataJornadas && dataJornadas.length > 0) {
        setJornadas(dataJornadas);
        const abierta = dataJornadas.find(j => j.estado === 'abierta') || dataJornadas[0];
        setJornadaSeleccionada(abierta);
      }

      // 2. Cargar Todos los Partidos y Pronósticos (Para Rankings)
      const { data: todosPartidos } = await supabase.from('partidos').select('*');
      const { data: pronosticosData } = await supabase.from('pronosticos').select('usuario_id, usuario_alias, puntos_obtenidos, partido_id, prediccion_local, prediccion_visitante');

      const mapaPartidos = new Map<number, number>(); // partidoId -> jornadaId
      todosPartidos?.forEach(p => mapaPartidos.set(p.id, p.jornada_id));

      if (pronosticosData) {
        const mapaGlobal = new Map<string, Posicion>();
        
        // Mis predicciones
        const misPredicciones: Record<number, EstadoPronostico> = {};

        pronosticosData.forEach(p => {
          // Si es un pronóstico mío, lo guardo para mostrarlo en pantalla
          if (p.usuario_id === user.id) {
            misPredicciones[p.partido_id] = {
              local: p.prediccion_local.toString(),
              visitante: p.prediccion_visitante.toString(),
              puntos_obtenidos: p.puntos_obtenidos || 0,
              guardado: true
            };
          }

          // Cálculos para el Ranking Global
          const uId = p.usuario_id || p.usuario_alias;
          const alias = p.usuario_alias || 'Anónimo';
          const puntos = p.puntos_obtenidos || 0;

          if (mapaGlobal.has(uId)) {
            mapaGlobal.get(uId)!.puntos += puntos;
          } else {
            mapaGlobal.set(uId, { usuario_id: uId, usuario_nombre: alias, puntos: puntos });
          }
        });

        setPredicciones(misPredicciones);
        setRankingGlobal(Array.from(mapaGlobal.values()).sort((a, b) => b.puntos - a.puntos));
      }
    };

    cargarDatos();
    return () => clearInterval(interval);
  }, [router]);

  // Efecto cuando cambia la jornada seleccionada
  useEffect(() => {
    const cargarJornada = async () => {
      if (!jornadaSeleccionada || !userId) return;

      // Saber si el usuario "Acreditó el poroto" para esta fecha
      const { data: dataInsc } = await supabase
        .from('inscripciones')
        .select('*')
        .eq('usuario_id', userId)
        .eq('jornada_id', jornadaSeleccionada.id)
        .single();
      
      setInscripcion(dataInsc || null);

      // Partidos de esta jornada
      const { data: partidosJornada } = await supabase
        .from('partidos')
        .select('*')
        .eq('jornada_id', jornadaSeleccionada.id)
        .order('fecha_hora', { ascending: true });
      
      if (partidosJornada) setPartidos(partidosJornada);

      // Recalcular Ranking de Esta Jornada
      const { data: pronosticosJornada } = await supabase
        .from('pronosticos')
        .select('usuario_id, usuario_alias, puntos_obtenidos, partido_id');
      
      const mapaFecha = new Map<string, Posicion>();
      pronosticosJornada?.forEach(p => {
        // Solo sumamos si el partido del pronóstico pertenece a la jornada actual
        const partidoDelPronostico = partidosJornada?.find(part => part.id === p.partido_id);
        if (partidoDelPronostico) {
          const uId = p.usuario_id || p.usuario_alias;
          const alias = p.usuario_alias || 'Anónimo';
          const puntos = p.puntos_obtenidos || 0;
          if (mapaFecha.has(uId)) {
            mapaFecha.get(uId)!.puntos += puntos;
          } else {
            mapaFecha.set(uId, { usuario_id: uId, usuario_nombre: alias, puntos: puntos });
          }
        }
      });
      setRankingJornada(Array.from(mapaFecha.values()).sort((a, b) => b.puntos - a.puntos));
    };

    cargarJornada();
  }, [jornadaSeleccionada, userId]);

  const solicitarInscripcion = async () => {
    if (!jornadaSeleccionada || !userId) return;
    setSolicitandoInscripcion(true);
    const { data, error } = await supabase.from('inscripciones').insert([{
        usuario_id: userId,
        jornada_id: jornadaSeleccionada.id
    }]).select().single();

    if (error) {
      alert("Error al solicitar: " + error.message);
    } else {
      setInscripcion(data);
    }
    setSolicitandoInscripcion(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleInputChange = (partidoId: number, equipo: 'local' | 'visitante', valor: string) => {
    if (predicciones[partidoId]?.guardado) return;
    setPredicciones(prev => ({
      ...prev, [partidoId]: { ...prev[partidoId], [equipo]: valor }
    }));
  };

  const habilitarEdicion = (partidoId: number) => {
    setPredicciones(prev => ({
      ...prev, [partidoId]: { ...prev[partidoId], guardado: false }
    }));
  };

  const guardarPronostico = async (partidoId: number) => {
    const prediccion = predicciones[partidoId];
    if (!prediccion?.local || !prediccion?.visitante) {
      alert("Por favor completá ambos goles antes de guardar.");
      return;
    }

    setGuardando(partidoId);

    const dataAInsertar = {
      usuario_id: userId,
      usuario_alias: userName,
      partido_id: partidoId,
      prediccion_local: parseInt(prediccion.local),
      prediccion_visitante: parseInt(prediccion.visitante),
      puntos_obtenidos: 0
    };

    const { error } = await supabase.from('pronosticos').upsert(dataAInsertar, { onConflict: 'usuario_id, partido_id' });

    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      setPredicciones(prev => ({
        ...prev, [partidoId]: { ...prev[partidoId], guardado: true }
      }));
    }
    setGuardando(null);
  };

  // Separar Partidos Activos de los que están a completar
  const partidosPendientes = partidos.filter(p => ahora && new Date(p.fecha_hora) > ahora);
  const partidosFinalizados = partidos.filter(p => ahora && new Date(p.fecha_hora) <= ahora);
  const habilitadoParaJugar = inscripcion?.pagado === true;

  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 pb-20">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* ENCABEZADO */}
        <header className="flex flex-col sm:flex-row justify-between items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl gap-4">
          <div className="flex items-center gap-4">
            <Image src="/logo.jpg" alt="Logo Prode Misiones" width={64} height={64} className="rounded-lg shadow-md" />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">PRODE <span className="text-emerald-400">MISIONES</span></h1>
              <p className="text-slate-400 mt-1 flex items-center gap-2">Hola, {userName} <Settings className="w-4 h-4 cursor-pointer hover:text-emerald-400 transition-colors" onClick={() => router.push('/configuracion')} title="Configuración"/></p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/reglas" className="bg-slate-700 hover:bg-emerald-500 text-slate-200 hover:text-slate-900 px-4 py-2 rounded-lg transition-colors text-sm font-bold border border-slate-600">Reglas</Link>
            <button onClick={handleLogout} className="bg-slate-700 hover:bg-red-500 text-slate-200 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm font-bold border border-slate-600 hover:border-red-500">Salir</button>
          </div>
        </header>

        {/* SELECTOR DE JORNADA */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Calendar className="text-indigo-400 w-5 h-5"/>
            <span className="font-bold text-slate-300">Seleccionar Fecha:</span>
          </div>
          <select 
            value={jornadaSeleccionada?.id || ''} 
            onChange={(e) => setJornadaSeleccionada(jornadas.find(x => x.id === parseInt(e.target.value)) || null)}
            className="w-full sm:w-64 bg-slate-900 border border-slate-600 rounded-lg p-2 text-white focus:border-indigo-500 focus:outline-none"
          >
            {jornadas.map(j => (
              <option key={j.id} value={j.id}>{j.nombre} {j.estado !== 'abierta' ? `(${j.estado})` : ''}</option>
            ))}
          </select>
        </div>

        {/* ALERTA DE INSCRIPCIÓN / PAGO */}
        {jornadaSeleccionada && !inscripcion ? (
          <div className="bg-amber-500/10 border border-amber-500/50 p-6 rounded-2xl text-center shadow-lg">
            <h3 className="text-amber-500 font-bold text-xl mb-2">¡Asegurá tu lugar en esta fecha!</h3>
            <p className="text-slate-300 text-sm mb-4 max-w-lg mx-auto">Para poder pronosticar y participar por el pozo de esta jornada, necesitás acreditar tu poroto.</p>
            <button onClick={solicitarInscripcion} disabled={solicitandoInscripcion} className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-8 rounded-lg transition-colors shadow-lg shadow-amber-900/20 disabled:opacity-50">
              {solicitandoInscripcion ? "Procesando..." : "Acreditar mi poroto"}
            </button>
          </div>
        ) : inscripcion && !inscripcion.pagado ? (
          <div className="bg-indigo-500/10 border border-indigo-500/50 p-6 rounded-2xl text-center shadow-lg">
            <h3 className="text-indigo-400 font-bold text-xl mb-2 flex justify-center items-center gap-2"><CheckCircle2 className="w-6 h-6"/> Solicitud enviada</h3>
            <p className="text-slate-300 text-sm max-w-lg mx-auto">Tu pedido está en revisión. Avisale al administrador para que valide tu participación y se habiliten los partidos.</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMNA IZQUIERDA: PARTIDOS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* PARTIDOS A COMPLETAR (FUTUROS) */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
              <h2 className="text-xl font-bold mb-6 text-emerald-400 flex items-center gap-2">
                <Edit2 className="w-5 h-5"/> Partidos a completar
              </h2>
              {partidosPendientes.length === 0 ? (
                 <div className="text-center py-8 bg-slate-900 rounded-xl border border-slate-700 opacity-60">
                   <p className="text-slate-400 font-medium">No hay partidos pendientes de inicio para esta jornada.</p>
                 </div>
              ) : (
                <ul className="space-y-4">
                  {partidosPendientes.map((partido) => {
                    const prediccion = predicciones[partido.id];
                    const estaGuardado = prediccion?.guardado;
                    return (
                      <li key={partido.id} className={`bg-slate-900 p-5 rounded-xl border ${estaGuardado ? 'border-emerald-500/50' : 'border-slate-700'} flex flex-col items-center gap-4 transition-all relative overflow-hidden ${!habilitadoParaJugar ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="text-center w-full border-b border-slate-800 pb-3">
                           <span className="text-xs text-amber-500 font-bold uppercase tracking-wider block mb-1">
                              {new Date(partido.fecha_hora).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                           </span>
                           <span className="font-bold text-lg">{partido.equipo_local} vs {partido.equipo_visitante}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 relative z-10">
                          <div className="flex items-center gap-3">
                            <input type="number" min="0" disabled={estaGuardado || !habilitadoParaJugar} className="w-14 h-14 bg-slate-800 border-2 border-slate-600 rounded-lg text-center font-bold text-xl focus:border-emerald-500 focus:outline-none disabled:opacity-50" value={prediccion?.local || ''} onChange={(e) => handleInputChange(partido.id, 'local', e.target.value)} />
                            <span className="text-slate-500 font-bold">-</span>
                            <input type="number" min="0" disabled={estaGuardado || !habilitadoParaJugar} className="w-14 h-14 bg-slate-800 border-2 border-slate-600 rounded-lg text-center font-bold text-xl focus:border-emerald-500 focus:outline-none disabled:opacity-50" value={prediccion?.visitante || ''} onChange={(e) => handleInputChange(partido.id, 'visitante', e.target.value)} />
                          </div>
                          {estaGuardado ? (
                            <button onClick={() => habilitarEdicion(partido.id)} className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-600 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400"/> Pronóstico Listo (Editar)
                            </button>
                          ) : (
                            <button onClick={() => guardarPronostico(partido.id)} disabled={guardando === partido.id || !habilitadoParaJugar} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 text-sm disabled:opacity-50">
                              {guardando === partido.id ? "Guardando..." : "Guardar Jugada"}
                            </button>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* PARTIDOS ACTIVOS (EN JUEGO / FINALIZADOS) */}
            {partidosFinalizados.length > 0 && (
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
                <h2 className="text-xl font-bold mb-6 text-slate-400 flex items-center gap-2">
                   <Lock className="w-5 h-5" /> partidos activos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {partidosFinalizados.map((partido) => {
                    const miPrediccion = predicciones[partido.id];
                    const resultadoOficial = partido.goles_local !== null && partido.goles_visitante !== null;
                    return (
                      <div key={partido.id} className="bg-slate-900 p-4 rounded-xl border border-red-900/50 flex flex-col items-center opacity-80 relative overflow-hidden">
                        <span className="text-[10px] text-red-400 font-bold mb-3 uppercase tracking-wider bg-red-500/10 px-2 py-1 rounded">Partido Finalizado</span>
                        
                        {/* Resultado Real (Oficial) */}
                        <div className="w-full text-center mb-4">
                          <p className="text-[11px] text-slate-400 uppercase font-bold tracking-widest mb-1">Resultado Oficial</p>
                          <div className="flex items-center justify-center gap-3">
                            <span className="font-bold text-sm text-right w-16 truncate text-white">{partido.equipo_local}</span>
                            <div className="flex items-center gap-1 font-black text-xl text-white">
                               <span>{resultadoOficial ? partido.goles_local : '-'}</span>
                               <span className="text-slate-600 text-sm mx-1">:</span>
                               <span>{resultadoOficial ? partido.goles_visitante : '-'}</span>
                            </div>
                            <span className="font-bold text-sm text-left w-16 truncate text-white">{partido.equipo_visitante}</span>
                          </div>
                        </div>

                        {/* Mi Pronóstico */}
                        <div className="w-full bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 flex flex-col items-center">
                          <p className="text-[11px] text-indigo-300 uppercase font-bold tracking-widest mb-2">Tu Pronóstico</p>
                          {miPrediccion ? (
                            <div className="flex items-center justify-center gap-3 w-full">
                               <span className="font-medium text-xs text-right w-12 truncate text-slate-400">{partido.equipo_local}</span>
                               <div className="flex items-center gap-2">
                                 <span className="bg-slate-700 w-6 h-6 flex items-center justify-center rounded text-sm font-bold text-white">{miPrediccion.local}</span>
                                 <span className="text-slate-600 text-xs">-</span>
                                 <span className="bg-slate-700 w-6 h-6 flex items-center justify-center rounded text-sm font-bold text-white">{miPrediccion.visitante}</span>
                               </div>
                               <span className="font-medium text-xs text-left w-12 truncate text-slate-400">{partido.equipo_visitante}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 font-medium italic">No participaste</span>
                          )}
                        </div>

                        {/* Puntos obtenidos */}
                        {resultadoOficial && miPrediccion && (
                          <div className="absolute top-2 right-2 bg-emerald-500/20 text-emerald-400 font-black text-xs px-2 py-1 rounded-full border border-emerald-500/30">
                            +{miPrediccion.puntos_obtenidos} pts
                          </div>
                        )}
                        {!resultadoOficial && (
                          <span className="text-[10px] text-amber-500 mt-3 font-medium">Esperando carga de resultados...</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: TABLA DE POSICIONES */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg h-fit sticky top-6">
            <h2 className="text-xl font-bold mb-4 text-emerald-400 flex items-center gap-2">
              <Trophy className="w-5 h-5"/> Tabla de Posiciones
            </h2>
            
            {/* PESTAÑAS DEL RANKING */}
            <div className="flex gap-2 mb-4 bg-slate-900 p-1 rounded-lg border border-slate-700">
              <button onClick={() => setTabRanking('fecha')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${tabRanking === 'fecha' ? 'bg-emerald-500 text-slate-900 shadow' : 'text-slate-400 hover:text-white'}`}>Esta Fecha</button>
              <button onClick={() => setTabRanking('global')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${tabRanking === 'global' ? 'bg-emerald-500 text-slate-900 shadow' : 'text-slate-400 hover:text-white'}`}>Global</button>
            </div>

            {(() => {
              const rankingActual = tabRanking === 'fecha' ? rankingJornada : rankingGlobal;
              
              if (rankingActual.length === 0) return <p className="text-slate-400 text-sm text-center py-6">Aún no hay puntos registrados.</p>;
              
              return (
                <ul className="space-y-3">
                  {rankingActual.map((pos, index) => (
                    <Link href={`/jugador/${pos.usuario_id}`} key={pos.usuario_id}>
                      <li className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700 hover:bg-slate-800/80 cursor-pointer transition-colors mb-3 group" title="Ver pronósticos">
                        <div className="flex items-center gap-3">
                          <span className={`font-bold w-6 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                            {index + 1}°
                          </span>
                          <span className="text-sm font-medium group-hover:text-emerald-400 transition-colors">{pos.usuario_nombre}</span>
                        </div>
                        <span className="font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full text-sm">
                          {pos.puntos} pts
                        </span>
                      </li>
                    </Link>
                  ))}
                </ul>
              )
            })()}
          </div>

        </div>
      </div>
      
      {/* MODAL DE BIENVENIDA */}
      {mostrarBienvenida && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-emerald-500/30 p-8 rounded-2xl shadow-2xl max-w-lg w-full relative">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">¡Bienvenido a Prode Misiones! ⚽</h2>
            <div className="space-y-4 text-slate-300 text-sm leading-relaxed mb-8">
              <p>Nacimos de la pasión por el fútbol y de esas eternas discusiones entre amigos para demostrar quién sabe más. Competí de forma sana y demostrá tus conocimientos.</p>
              <p>📖 Para conocer los detalles de puntuación, visitá la sección <Link href="/reglas" className="text-emerald-400 hover:text-emerald-300 font-bold underline transition-colors">Reglas</Link>.</p>
            </div>
            <button onClick={() => setMostrarBienvenida(false)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-4 rounded-lg transition-colors">
              ¡Empezar a jugar!
            </button>
          </div>
        </div>
      )}
    </main>
  );
}