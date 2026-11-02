"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

type Partido = {
  id: number;
  equipo_local: string;
  equipo_visitante: string;
  fecha_hora: string;
};

type Posicion = {
  usuario: string;
  puntos: number;
};

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState<string | undefined>("");
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [predicciones, setPredicciones] = useState<Record<number, { local: string, visitante: string }>>({});
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkUserAndLoadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        
        // 1. Cargar próximos partidos
        const { data: partidosData } = await supabase
          .from('partidos')
          .select('*')
          .order('fecha_hora', { ascending: true });

        if (partidosData) setPartidos(partidosData);

        // 2. Cargar pronósticos y calcular tabla de posiciones
        const { data: pronosticosData } = await supabase
          .from('pronosticos')
          .select('usuario_alias, puntos_obtenidos');

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
        [equipo]: valor
      }
    }));
  };

  const guardarPronostico = async (partidoId: number) => {
    const prediccion = predicciones[partidoId];
    if (!prediccion?.local || !prediccion?.visitante) {
      alert("Por favor completá ambos goles antes de guardar.");
      return;
    }

    const { error } = await supabase
      .from('pronosticos')
      .insert([
        { 
          usuario_alias: userEmail,
          partido_id: partidoId,
          prediccion_local: parseInt(prediccion.local),
          prediccion_visitante: parseInt(prediccion.visitante),
          puntos_obtenidos: 0
        }
      ]);

    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      alert("¡Pronóstico guardado con éxito!");
      window.location.reload(); // Recarga para actualizar la tabla de posiciones automáticamente
    }
  };

  const formatFecha = (fechaString: string) => {
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return new Date(fechaString).toLocaleDateString('es-AR', opciones);
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-10 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              PRODE <span className="text-emerald-400">MISIONES</span>
            </h1>
            <p className="text-slate-400 mt-1">Hola, {userEmail}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-slate-700 hover:bg-red-500 text-slate-200 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm font-bold border border-slate-600 hover:border-red-500"
          >
            Cerrar Sesión
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg h-fit">
            <h2 className="text-xl font-bold mb-4 text-emerald-400">Próximos Partidos</h2>
            
            {partidos.length === 0 ? (
              <p className="text-slate-400 text-sm">Cargando partidos...</p>
            ) : (
              <ul className="space-y-4">
                {partidos.map((partido) => (
                  <li key={partido.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col items-center">
                     <span className="text-xs text-slate-400 mb-3">{formatFecha(partido.fecha_hora)}</span>
                     
                     <div className="flex items-center justify-center gap-3 w-full mb-3">
                        <span className="font-bold text-lg text-right w-24">{partido.equipo_local}</span>
                        
                        <input 
                          type="number" 
                          min="0"
                          className="w-12 h-10 bg-slate-800 border border-slate-600 rounded text-center font-bold focus:border-emerald-500 focus:outline-none"
                          value={predicciones[partido.id]?.local || ''}
                          onChange={(e) => handleInputChange(partido.id, 'local', e.target.value)}
                        />
                        
                        <span className="text-slate-500 font-bold px-1">-</span>
                        
                        <input 
                          type="number" 
                          min="0"
                          className="w-12 h-10 bg-slate-800 border border-slate-600 rounded text-center font-bold focus:border-emerald-500 focus:outline-none"
                          value={predicciones[partido.id]?.visitante || ''}
                          onChange={(e) => handleInputChange(partido.id, 'visitante', e.target.value)}
                        />

                        <span className="font-bold text-lg text-left w-24">{partido.equipo_visitante}</span>
                     </div>

                     <button 
                        onClick={() => guardarPronostico(partido.id)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-2 rounded transition-colors"
                     >
                        Guardar Predicción
                     </button>
                  </li>
                ))}
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
                      <span className="text-sm font-medium">{pos.usuario.split('@')[0]}</span>
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
      </div>
    </main>
  );
}