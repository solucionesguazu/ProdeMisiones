"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Calculator } from "lucide-react";
import Image from "next/image";

type Partido = {
  id: number;
  equipo_local: string;
  equipo_visitante: string;
  fecha_hora: string;
};

export default function AdminPanel() {
  // REEMPLAZÁ ESTE CORREO POR TU CORREO REAL DE ADMINISTRADOR
  const ADMIN_EMAIL = "jmrebatta@gmail.com"; 

  const [partidosPendientes, setPartidosPendientes] = useState<Partido[]>([]);
  const [resultados, setResultados] = useState<Record<number, { local: string; visitante: string }>>({});
  const [cargando, setCargando] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const verificarAdminYCargar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || user.email !== ADMIN_EMAIL) {
        alert("Acceso denegado. Solo el administrador puede ver esta página.");
        router.push("/dashboard");
        return;
      }

      // Buscar partidos cuya fecha ya pasó y que aún no tienen resultados cargados (goles_local es null)
      const ahora = new Date().toISOString();
      const { data } = await supabase
        .from('partidos')
        .select('id, equipo_local, equipo_visitante, fecha_hora')
        .lt('fecha_hora', ahora)
        .is('goles_local', null)
        .order('fecha_hora', { ascending: true });

      if (data) {
        setPartidosPendientes(data);
      }
    };

    verificarAdminYCargar();
  }, [router]);

  const handleInputChange = (partidoId: number, equipo: 'local' | 'visitante', valor: string) => {
    setResultados(prev => ({
      ...prev,
      [partidoId]: {
        ...prev[partidoId],
        [equipo]: valor
      }
    }));
  };

  const guardarYCalcular = async (partidoId: number) => {
    const res = resultados[partidoId];
    if (!res?.local || !res?.visitante) {
      alert("Completá ambos goles del resultado oficial.");
      return;
    }

    setCargando(partidoId);
    const realLocal = parseInt(res.local);
    const realVisitante = parseInt(res.visitante);

    // 1. Guardar el resultado oficial en la tabla partidos
    await supabase
      .from('partidos')
      .update({ goles_local: realLocal, goles_visitante: realVisitante })
      .eq('id', partidoId);

    // 2. Traer todos los pronósticos de la gente para este partido
    const { data: pronosticos } = await supabase
      .from('pronosticos')
      .select('id, prediccion_local, prediccion_visitante')
      .eq('partido_id', partidoId);

    if (pronosticos && pronosticos.length > 0) {
      // 3. Evaluar cada pronóstico y calcular los puntos matemáticamente
      const promesas = pronosticos.map(p => {
        let puntos = 0;
        
        // Regla 1: Resultado Exacto (6 puntos)
        if (p.prediccion_local === realLocal && p.prediccion_visitante === realVisitante) {
          puntos = 6;
        } 
        // Regla 2: Acertó ganador o empate, pero no el resultado exacto (3 puntos)
        else {
          const diferenciaReal = Math.sign(realLocal - realVisitante);
          const diferenciaPred = Math.sign(p.prediccion_local - p.prediccion_visitante);
          
          if (diferenciaReal === diferenciaPred) {
            puntos = 3;
          }
        }

        // Actualizar los puntos de este jugador en la base de datos
        return supabase
          .from('pronosticos')
          .update({ puntos_obtenidos: puntos })
          .eq('id', p.id);
      });

      // Ejecutar todas las actualizaciones de los jugadores al mismo tiempo
      await Promise.all(promesas);
    }

    // 4. Limpiar el partido de la pantalla
    setPartidosPendientes(prev => prev.filter(p => p.id !== partidoId));
    setCargando(null);
    alert("¡Resultados guardados y puntos repartidos a todos los jugadores!");
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-slate-800 p-6 rounded-2xl border border-amber-500/50 shadow-xl gap-4">
          <div className="flex items-center gap-4">
            <Image src="/logo.jpg" alt="Logo" width={50} height={50} className="rounded-lg" />
            <div>
              <h1 className="text-2xl font-extrabold text-amber-500 flex items-center gap-2">
                PANEL DE ADMINISTRADOR
              </h1>
              <p className="text-slate-400 text-sm">Central de Carga de Resultados</p>
            </div>
          </div>
          <Link href="/dashboard" className="flex items-center text-slate-300 hover:text-white transition-colors bg-slate-700 px-4 py-2 rounded-lg text-sm font-bold">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Juego
          </Link>
        </header>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <h2 className="text-xl font-bold mb-6 text-slate-200">Partidos Pendientes de Carga</h2>
          
          {partidosPendientes.length === 0 ? (
            <div className="text-center py-10 bg-slate-900 rounded-xl border border-slate-700">
              <p className="text-emerald-400 font-bold text-lg mb-2">¡Todo al día!</p>
              <p className="text-slate-500 text-sm">No hay partidos terminados pendientes de resultados.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {partidosPendientes.map((partido) => (
                <li key={partido.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                  
                  <div className="flex-1 text-center md:text-left">
                     <span className="text-xs text-amber-500 font-bold uppercase tracking-wider block mb-1">
                        {new Date(partido.fecha_hora).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                     </span>
                     <span className="font-bold text-lg">{partido.equipo_local} vs {partido.equipo_visitante}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input 
                      type="number" min="0" placeholder="L"
                      className="w-14 h-12 bg-slate-800 border-2 border-slate-600 rounded-lg text-center font-bold text-lg focus:border-amber-500 focus:outline-none"
                      value={resultados[partido.id]?.local || ''}
                      onChange={(e) => handleInputChange(partido.id, 'local', e.target.value)}
                    />
                    <span className="text-slate-500 font-bold">-</span>
                    <input 
                      type="number" min="0" placeholder="V"
                      className="w-14 h-12 bg-slate-800 border-2 border-slate-600 rounded-lg text-center font-bold text-lg focus:border-amber-500 focus:outline-none"
                      value={resultados[partido.id]?.visitante || ''}
                      onChange={(e) => handleInputChange(partido.id, 'visitante', e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={() => guardarYCalcular(partido.id)}
                    disabled={cargando === partido.id}
                    className="w-full md:w-auto bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {cargando === partido.id ? (
                      "Calculando..."
                    ) : (
                      <>
                        <Calculator className="w-5 h-5" /> Repartir Puntos
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}