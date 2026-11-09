"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calculator, PlusCircle, Users, Trash2, ShieldAlert } from "lucide-react";
import Image from "next/image";

type Partido = {
  id: number;
  equipo_local: string;
  equipo_visitante: string;
  fecha_hora: string;
};

type Jugador = {
  id: string;
  alias: string;
  pronosticos_count: number;
};

export default function AdminPanel() {
  const [partidosPendientes, setPartidosPendientes] = useState<Partido[]>([]);
  const [resultados, setResultados] = useState<Record<number, { local: string; visitante: string }>>({});
  const [cargando, setCargando] = useState<number | null>(null);
  
  // Estados para el nuevo partido
  const [nuevoLocal, setNuevoLocal] = useState("");
  const [nuevoVisitante, setNuevoVisitante] = useState("");
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [guardandoPartido, setGuardandoPartido] = useState(false);

  // Estados para la gestión de jugadores
  const [jugadores, setJugadores] = useState<Jugador[]>([]);

  const router = useRouter();

  useEffect(() => {
    const verificarAdminYCargar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Verificar si hay un usuario logueado
      if (!user) {
        router.push("/dashboard");
        return;
      }

      // 2. VERIFICACIÓN REAL DE ADMIN: Consulta a la nueva tabla 'admins'
      const { data: adminData } = await supabase
        .from('admins')
        .select('email')
        .eq('email', user.email)
        .single();

      if (!adminData) {
        alert("Acceso denegado. Solo los administradores registrados pueden ver esta página.");
        router.push("/dashboard");
        return;
      }

      // 3. Cargar partidos pendientes
      const ahora = new Date().toISOString();
      const { data: partidos } = await supabase
        .from('partidos')
        .select('id, equipo_local, equipo_visitante, fecha_hora')
        .lt('fecha_hora', ahora)
        .is('goles_local', null)
        .order('fecha_hora', { ascending: true });

      if (partidos) {
        setPartidosPendientes(partidos);
      }

      // 4. Cargar jugadores activos (agrupando desde pronosticos)
      const { data: pronosticos } = await supabase
        .from('pronosticos')
        .select('usuario_id, usuario_alias');

      if (pronosticos) {
        const mapaJugadores = new Map<string, Jugador>();
        pronosticos.forEach(p => {
          const uId = p.usuario_id || p.usuario_alias;
          if (!mapaJugadores.has(uId)) {
            mapaJugadores.set(uId, { id: uId, alias: p.usuario_alias || 'Anónimo', pronosticos_count: 1 });
          } else {
            mapaJugadores.get(uId)!.pronosticos_count++;
          }
        });
        setJugadores(Array.from(mapaJugadores.values()).sort((a, b) => b.pronosticos_count - a.pronosticos_count));
      }
    };

    verificarAdminYCargar();
  }, [router]);

  // Funciones de Partidos (Crear y Calcular)
  const handleInputChange = (partidoId: number, equipo: 'local' | 'visitante', valor: string) => {
    setResultados(prev => ({
      ...prev, [partidoId]: { ...prev[partidoId], [equipo]: valor }
    }));
  };

  const cargarNuevoPartido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoLocal || !nuevoVisitante || !nuevaFecha) {
      alert("Completá todos los campos para crear el partido.");
      return;
    }
    setGuardandoPartido(true);
    const fechaConZonaHoraria = new Date(nuevaFecha).toISOString(); 

    const { error } = await supabase
      .from('partidos')
      .insert([{ equipo_local: nuevoLocal, equipo_visitante: nuevoVisitante, fecha_hora: fechaConZonaHoraria }]);

    if (error) {
      alert("Error al guardar el partido: " + error.message);
    } else {
      alert("¡Partido publicado con éxito!");
      setNuevoLocal(""); setNuevoVisitante(""); setNuevaFecha("");
    }
    setGuardandoPartido(false);
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

    await supabase.from('partidos').update({ goles_local: realLocal, goles_visitante: realVisitante }).eq('id', partidoId);

    const { data: pronosticos } = await supabase.from('pronosticos').select('id, prediccion_local, prediccion_visitante').eq('partido_id', partidoId);

    if (pronosticos && pronosticos.length > 0) {
      const promesas = pronosticos.map(p => {
        let puntos = 0;
        if (p.prediccion_local === realLocal && p.prediccion_visitante === realVisitante) {
          puntos = 6;
        } else {
          const diferenciaReal = Math.sign(realLocal - realVisitante);
          const diferenciaPred = Math.sign(p.prediccion_local - p.prediccion_visitante);
          if (diferenciaReal === diferenciaPred) puntos = 3;
        }
        return supabase.from('pronosticos').update({ puntos_obtenidos: puntos }).eq('id', p.id);
      });
      await Promise.all(promesas);
    }

    setPartidosPendientes(prev => prev.filter(p => p.id !== partidoId));
    setCargando(null);
    alert("¡Resultados guardados y puntos repartidos a todos los jugadores!");
  };

  // Funciones de Gestión de Jugadores
  const eliminarJugador = async (idJugador: string, alias: string) => {
    const confirmacion = window.confirm(`ATENCIÓN: ¿Estás seguro de que querés eliminar a ${alias}? Esto borrará todos sus pronósticos y lo sacará del ranking de forma irreversible.`);
    if (confirmacion) {
      const { error } = await supabase.from('pronosticos').delete().eq('usuario_id', idJugador);
      if (!error) {
        setJugadores(prev => prev.filter(j => j.id !== idJugador));
        alert(`Los datos de ${alias} fueron eliminados del torneo.`);
      } else {
        alert("Error al eliminar: " + error.message);
      }
    }
  };

  const bloquearJugadorInfo = () => {
    alert("Para BLOQUEAR el acceso (que no puedan iniciar sesión), ingresá a supabase.com > Authentication > Users. Hacé clic en los 3 puntitos al lado del correo del infractor y seleccioná 'Suspend User'.");
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-5xl mx-auto pb-12">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-slate-800 p-6 rounded-2xl border border-amber-500/50 shadow-xl gap-4">
          <div className="flex items-center gap-4">
            <Image src="/logo.jpg" alt="Logo" width={50} height={50} className="rounded-lg object-cover" />
            <div>
              <h1 className="text-2xl font-extrabold text-amber-500 flex items-center gap-2">
                PANEL DE ADMINISTRADOR
              </h1>
              <p className="text-slate-400 text-sm">Centro de Control Prode</p>
            </div>
          </div>
          <Link href="/dashboard" className="flex items-center text-slate-300 hover:text-white transition-colors bg-slate-700 px-4 py-2 rounded-lg text-sm font-bold border border-slate-600">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Juego
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* SECCIÓN 1: CREAR PARTIDO */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg h-fit">
            <h2 className="text-xl font-bold mb-6 text-emerald-400 flex items-center gap-2">
              <PlusCircle className="w-5 h-5"/> Crear Nuevo Partido
            </h2>
            <form onSubmit={cargarNuevoPartido} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-1">Equipo Local</label>
                <input type="text" required placeholder="Ej: Boca Juniors" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none" value={nuevoLocal} onChange={(e) => setNuevoLocal(e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-1">Equipo Visitante</label>
                <input type="text" required placeholder="Ej: River Plate" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none" value={nuevoVisitante} onChange={(e) => setNuevoVisitante(e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-1">Fecha y Hora de Inicio</label>
                <input type="datetime-local" required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none [color-scheme:dark]" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} />
                <p className="text-xs text-slate-500 mt-2">Los usuarios podrán cargar pronósticos hasta esta fecha exacta.</p>
              </div>
              <button type="submit" disabled={guardandoPartido} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-2 disabled:opacity-50">
                {guardandoPartido ? "Publicando partido..." : "Publicar Partido"}
              </button>
            </form>
          </div>

          {/* SECCIÓN 2: CARGAR RESULTADOS Y REPARTIR PUNTOS */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg h-fit">
            <h2 className="text-xl font-bold mb-6 text-amber-500 flex items-center gap-2">
               <Calculator className="w-5 h-5"/> Repartir Puntos
            </h2>
            {partidosPendientes.length === 0 ? (
              <div className="text-center py-10 bg-slate-900 rounded-xl border border-slate-700">
                <p className="text-emerald-400 font-bold text-lg mb-2">¡Todo al día!</p>
                <p className="text-slate-500 text-sm">No hay partidos terminados pendientes de resultados.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {partidosPendientes.map((partido) => (
                  <li key={partido.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col items-center gap-4">
                    <div className="text-center w-full border-b border-slate-800 pb-3">
                       <span className="text-xs text-amber-500 font-bold uppercase tracking-wider block mb-1">
                          {new Date(partido.fecha_hora).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                       </span>
                       <span className="font-bold text-lg">{partido.equipo_local} vs {partido.equipo_visitante}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
                      <div className="flex items-center gap-3">
                        <input type="number" min="0" placeholder="L" className="w-12 h-12 bg-slate-800 border-2 border-slate-600 rounded-lg text-center font-bold text-lg focus:border-amber-500 focus:outline-none" value={resultados[partido.id]?.local || ''} onChange={(e) => handleInputChange(partido.id, 'local', e.target.value)} />
                        <span className="text-slate-500 font-bold">-</span>
                        <input type="number" min="0" placeholder="V" className="w-12 h-12 bg-slate-800 border-2 border-slate-600 rounded-lg text-center font-bold text-lg focus:border-amber-500 focus:outline-none" value={resultados[partido.id]?.visitante || ''} onChange={(e) => handleInputChange(partido.id, 'visitante', e.target.value)} />
                      </div>
                      <button onClick={() => guardarYCalcular(partido.id)} disabled={cargando === partido.id} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
                        {cargando === partido.id ? "Calculando..." : "Guardar & Calcular"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* SECCIÓN 3: GESTIÓN DE JUGADORES */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 border-b border-slate-700 pb-4">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400"/> Gestión de Jugadores
             </h2>
             <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-700 text-sm font-bold">
               Total Activos: <span className="text-emerald-400 ml-1">{jugadores.length}</span>
             </div>
          </div>

          {jugadores.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">Aún no hay jugadores con pronósticos cargados.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jugadores.map(jugador => (
                <div key={jugador.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col justify-between">
                  <div className="mb-4">
                    <p className="font-bold text-lg text-white truncate" title={jugador.alias}>{jugador.alias}</p>
                    <p className="text-xs text-slate-400">ID: {jugador.id.split('-')[0]}...</p>
                    <div className="mt-2 bg-slate-800 inline-block px-2 py-1 rounded text-xs font-semibold text-emerald-400">
                      {jugador.pronosticos_count} pronósticos cargados
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    <button onClick={() => eliminarJugador(jugador.id, jugador.alias)} className="flex-1 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/50 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1">
                      <Trash2 className="w-3 h-3"/> Eliminar Datos
                    </button>
                    <button onClick={bloquearJugadorInfo} className="bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-500 border border-slate-700 hover:border-amber-500/50 p-2 rounded-lg transition-colors" title="Bloquear cuenta">
                      <ShieldAlert className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}