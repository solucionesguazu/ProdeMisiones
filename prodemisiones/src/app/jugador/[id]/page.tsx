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
  usuario_id: string; // ¡ACÁ ESTÁ EL ARREGLO! Antes esto no existía
};

export default function Dashboard() {
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [predicciones, setPredicciones] = useState<Record<number, any>>({});
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [mostrarBienvenida, setMostrarBienvenida] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUserAndLoadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const alias = user.user_metadata?.nombre || user.email?.split('@')[0] || "Jugador";
        setUserName(alias);

        // 1. Cargar próximos partidos
        const { data: partidosData } = await supabase
          .from('partidos')
          .select('*')
          .order('fecha_hora', { ascending: true });
        
        if (partidosData) setPartidos(partidosData);

        // 2. Cargar MIS pronósticos para los casilleros
        const { data: misPronosticos } = await supabase
          .from('pronosticos')
          .select('*')
          .eq('usuario_id', user.id);
          
        if (misPronosticos) {
          const dict: Record<number, any> = {};
          misPronosticos.forEach(p => {
            dict[p.partido_id] = {
              local: p.prediccion_local.toString(),
              visitante: p.prediccion_visitante.toString(),
              guardado: true,
              puntos_obtenidos: p.puntos_obtenidos
            };
          });
          setPredicciones(dict);
        }

        // 3. Cargar TODO para el ranking (AHORA PIDIENDO EL usuario_id)
        const { data: pronosticosData } = await supabase
          .from('pronosticos')
          .select('usuario_alias, puntos_obtenidos, usuario_id');

        if (pronosticosData) {
          const ranking: Record<string, { alias: string, puntos: number, id: string }> = {};
          
          pronosticosData.forEach(p => {
            // Usamos el ID como clave primaria para evitar errores
            const idClave = p.usuario_id || p.usuario_alias || 'Anónimo';
            if (!ranking[idClave]) {
              ranking[idClave] = { 
                alias: p.usuario_alias || 'Anónimo', 
                puntos: 0, 
                id: idClave 
              };
            }
            ranking[idClave].puntos += (p.puntos_obtenidos || 0);
          });

          const rankingArray = Object.values(ranking)
            .map(item => ({ usuario: item.alias, puntos: item.puntos, usuario_id: item.id }))
            .sort((a, b) => b.puntos - a.puntos);
            
          setPosiciones(rankingArray);
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
      [partidoId]: { ...prev[partidoId], [equipo]: valor }
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

    const { data: existente } = await supabase
      .from('pronosticos')
      .select('id')
      .eq('usuario_id', userId)
      .eq('partido_id', partidoId)
      .single();

    let errorG;

    if (existente) {
      const { error } = await supabase
        .from('pronosticos')
        .update({
          prediccion_local: parseInt(prediccion.local),
          prediccion_visitante: parseInt(prediccion.visitante),
          usuario_alias: userName
        })
        .eq('id', existente.id);
      errorG = error;
    } else {
      const { error } = await supabase
        .from('pronosticos')
        .insert([
          {
            usuario_id: userId,
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
      setPredicciones(prev => ({ ...prev, [partidoId]: { ...prev[partidoId], guardado: true } }));
    }
  };

  const formatFecha = (fechaString: string) => {
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return new Date(fechaString).toLocaleDateString('es-AR', opciones);
  };

  const ahora = new Date();
  const partidosActivos = partidos.filter(p => new Date(p.fecha_hora) > ahora);
  const partidosFinalizados = partidos.filter(p => new Date(p.fecha_hora) <= ahora).slice(-20).reverse();

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6 pb-20">
      <div className="max-w-6xl mx-auto">
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
               <Settings className="w-6 h-6" />
             </Link>
             <Link href="/reglas" className="bg-slate-700 hover:bg-emerald-500 text-slate-200 hover:text-slate-900 px-4 py-2 rounded-lg transition-colors text-sm font-bold border border-slate-600 hover:border-emerald-500">
               Ver Reglas
             </Link>
             <button onClick={handleLogout} className="bg-slate-700 hover:bg-red-500 text-slate-200 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm font-bold border border-slate-600 hover:border-red-500">
               Salir
             </button>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUMNA IZQUIERDA: PARTIDOS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
              <h2 className="text-xl font-bold mb-6 text-emerald-400">Próximos Partidos</h2>
              {partidosActivos.length === 0 ? (
                <p className="text-slate-400 text-sm">No hay partidos próximos disponibles.</p>
              ) : (
                <ul className="space-y-4">
                  {partidosActivos.map((partido) => {
                    const estaGuardado = predicciones[partido.id]?.guardado;
                    return (
                      <li key={partido.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col items-center">
                        <span className="text-xs text-slate-400 mb-3">{formatFecha(partido.fecha_hora)}</span>
                        
                        <div className="flex items-center justify-center gap-2 w-full mb-4">
                           <span className="font-bold text-sm text-right w-20 truncate">{partido.equipo_local}</span>
                           <input type="number" min="0" className="w-12 h-12 bg-slate-800 border-2 border-slate-600 rounded-lg text-center font-bold text-lg focus:border-emerald-500 focus:outline-none disabled:opacity-50" value={predicciones[partido.id]?.local || ''} onChange={(e) => handleInputChange(partido.id, 'local', e.target.value)} disabled={estaGuardado} />
                           <span className="text-slate-600 font-bold">-</span>
                           <input type="number" min="0" className="w-12 h-12 bg-slate-800 border-2 border-slate-600 rounded-lg text-center font-bold text-lg focus:border-emerald-500 focus:outline-none disabled:opacity-50" value={predicciones[partido.id]?.visitante || ''} onChange={(e) => handleInputChange(partido.id, 'visitante', e.target.value)} disabled={estaGuardado} />
                           <span className="font-bold text-sm text-left w-20 truncate">{partido.equipo_visitante}</span>
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
                    )
                  })}
                </ul>
              )}
            </div>

            {/* PARTIDOS FINALIZADOS */}
            {partidosFinalizados.length > 0 && (
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg mt-6">
                <h2 className="text-xl font-bold mb-4 text-slate-300 flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-500"/> Últimos Partidos Finalizados
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                        <div className="bg-slate-800 px-3 py-2 rounded-lg flex flex-col items-center gap-1 w-full justify-center border border-slate-700/50">
                           <span className="text-slate-400 text-xs">Tu pronóstico: <strong className="text-slate-200">
                             {miPronostico?.local || '-'} a {miPronostico?.visitante || '-'}</strong></span>
                           {resultadoOficial && (
                             <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${miPronostico?.puntos_obtenidos === 6 ? 'bg-emerald-500/20 text-emerald-400' : miPronostico?.puntos_obtenidos === 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                               +{miPronostico?.puntos_obtenidos || 0} pts
                             </span>
                           )}
                        </div>
                        {!resultadoOficial && (
                           <span className="text-[10px] text-amber-500 mt-2 font-medium">Falta cargar resultado real</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: TABLA DE POSICIONES */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg h-fit">
            <h2 className="text-xl font-bold mb-4 text-emerald-400">Tabla de Posiciones</h2>
            {posiciones.length === 0 ? (
              <p className="text-slate-400 text-sm">Todavía no hay puntajes registrados.</p>
            ) : (
              <ul className="space-y-3">
                {posiciones.map((pos, index) => (
                  <Link href={`/jugador/${pos.usuario_id}`} key={pos.usuario_id} className="block transition-transform hover:scale-105">
                    <li className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700 hover:border-emerald-500/50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className={`font-bold w-6 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                          {index + 1}°
                        </span>
                        <span className="text-sm font-medium truncate max-w-[120px]" title={pos.usuario}>{pos.usuario}</span>
                      </div>
                      <span className="font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full text-sm">
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
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              ¡Bienvenido a Prode Misiones! ⚽
            </h2>
            <div className="space-y-4 text-slate-300 text-sm leading-relaxed mb-8">
              <p>Nacimos de la pasión por el fútbol y de esas eternas discusiones entre amigos para demostrar quién sabe más...</p>
              <p>🏆 ¡Hacé tu jugada, poné a prueba tus conocimientos y convertite en el rey de los pronósticos!</p>
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