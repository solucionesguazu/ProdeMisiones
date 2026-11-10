"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calculator, PlusCircle, Users, Trash2, ShieldAlert, CalendarRange, CheckCircle2 } from "lucide-react";
import Image from "next/image";

type Jornada = {
  id: number;
  nombre: string;
  activa: boolean;
  estado: string;
};

type Partido = {
  id: number;
  equipo_local: string;
  equipo_visitante: string;
  fecha_hora: string;
  jornada_id: number;
  jornadas?: { nombre: string };
};

type Jugador = {
  id: string;
  alias: string;
  pronosticos_count: number;
};

type Inscripcion = {
  id: number;
  usuario_id: string;
  jornada_id: number;
  pagado: boolean;
  jornadas?: { nombre: string };
};

export default function AdminPanel() {
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [nuevaJornada, setNuevaJornada] = useState("");
  const [guardandoJornada, setGuardandoJornada] = useState(false);

  const [partidosPendientes, setPartidosPendientes] = useState<Partido[]>([]);
  const [resultados, setResultados] = useState<Record<number, { local: string; visitante: string }>>({});
  const [cargando, setCargando] = useState<number | null>(null);
  
  const [nuevoLocal, setNuevoLocal] = useState("");
  const [nuevoVisitante, setNuevoVisitante] = useState("");
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState("");
  const [guardandoPartido, setGuardandoPartido] = useState(false);

  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);

  const router = useRouter();

  const cargarDatosAdmin = async () => {
    // 1. Cargar Jornadas
    const { data: dataJornadas } = await supabase.from('jornadas').select('*').order('id', { ascending: false });
    if (dataJornadas) setJornadas(dataJornadas);

    // 2. Cargar Partidos Pendientes
    const ahora = new Date().toISOString();
    const { data: partidos } = await supabase
      .from('partidos')
      .select('id, equipo_local, equipo_visitante, fecha_hora, jornada_id, jornadas(nombre)')
      .lt('fecha_hora', ahora)
      .is('goles_local', null)
      .order('fecha_hora', { ascending: true });
    if (partidos) setPartidosPendientes(partidos as any);

    // 3. Cargar Jugadores (Históricos)
    const { data: pronosticos } = await supabase.from('pronosticos').select('usuario_id, usuario_alias');
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

    // 4. Cargar Inscripciones de Pagos
    const { data: dataInscripciones } = await supabase
      .from('inscripciones')
      .select('id, usuario_id, jornada_id, pagado, jornadas(nombre)')
      .order('id', { ascending: false });
    if (dataInscripciones) setInscripciones(dataInscripciones as any);
  };

  useEffect(() => {
    const verificarAdminYCargar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/dashboard");
        return;
      }
      const { data: adminData } = await supabase.from('admins').select('email').eq('email', user.email).single();
      if (!adminData) {
        alert("Acceso denegado.");
        router.push("/dashboard");
        return;
      }
      await cargarDatosAdmin();
    };
    verificarAdminYCargar();
  }, [router]);

  // Funciones de Jornadas
  const crearNuevaJornada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaJornada) return;
    setGuardandoJornada(true);
    const { error } = await supabase.from('jornadas').insert([{ nombre: nuevaJornada }]);
    if (error) {
      alert("Error al crear jornada: " + error.message);
    } else {
      alert("¡Jornada creada con éxito!");
      setNuevaJornada("");
      await cargarDatosAdmin();
    }
    setGuardandoJornada(false);
  };

  // Funciones de Pagos (Inscripciones)
  const togglePago = async (idInscripcion: number, estadoActual: boolean) => {
    const { error } = await supabase
      .from('inscripciones')
      .update({ pagado: !estadoActual })
      .eq('id', idInscripcion);
      
    if (error) {
      alert("Error al actualizar el pago: " + error.message);
    } else {
      await cargarDatosAdmin(); // Recargamos para que impacte visualmente
    }
  };

  // Funciones de Partidos
  const handleInputChange = (partidoId: number, equipo: 'local' | 'visitante', valor: string) => {
    setResultados(prev => ({ ...prev, [partidoId]: { ...prev[partidoId], [equipo]: valor } }));
  };

  const cargarNuevoPartido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoLocal || !nuevoVisitante || !nuevaFecha || !jornadaSeleccionada) {
      alert("Completá todos los campos y seleccioná una jornada.");
      return;
    }
    setGuardandoPartido(true);
    const fechaConZonaHoraria = new Date(nuevaFecha).toISOString(); 

    const { error } = await supabase
      .from('partidos')
      .insert([{ 
        equipo_local: nuevoLocal, 
        equipo_visitante: nuevoVisitante, 
        fecha_hora: fechaConZonaHoraria,
        jornada_id: parseInt(jornadaSeleccionada)
      }]);

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
    
    const { error } = await supabase.rpc('cargar_resultado', {
      p_partido_id: partidoId,
      p_goles_local: parseInt(res.local),
      p_goles_visitante: parseInt(res.visitante)
    });

    if (error) {
      alert("Error en el servidor al calcular puntos: " + error.message);
    } else {
      setPartidosPendientes(prev => prev.filter(p => p.id !== partidoId));
      alert("¡Resultados guardados y puntos repartidos exitosamente!");
    }
    setCargando(null);
  };

  const eliminarJugador = async (idJugador: string, alias: string) => {
    const confirmacion = window.confirm(`¿Seguro que querés eliminar a ${alias}?`);
    if (confirmacion) {
      const { error } = await supabase.from('pronosticos').delete().eq('usuario_id', idJugador);
      if (!error) {
        setJugadores(prev => prev.filter(j => j.id !== idJugador));
        alert(`Datos de ${alias} eliminados.`);
      }
    }
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

        {/* GESTIÓN DE JORNADAS */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg mb-6">
          <h2 className="text-xl font-bold mb-6 text-indigo-400 flex items-center gap-2">
            <CalendarRange className="w-5 h-5"/> Gestión de Jornadas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form onSubmit={crearNuevaJornada} className="bg-slate-900 p-4 rounded-xl border border-slate-700">
              <label className="block text-sm font-bold text-slate-400 mb-2">Crear Nueva Jornada</label>
              <div className="flex gap-2">
                <input type="text" required placeholder="Ej: Fecha 1" className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none" value={nuevaJornada} onChange={(e) => setNuevaJornada(e.target.value)} />
                <button type="submit" disabled={guardandoJornada} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                  {guardandoJornada ? "..." : "Crear"}
                </button>
              </div>
            </form>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 max-h-32 overflow-y-auto">
              <label className="block text-sm font-bold text-slate-400 mb-2">Jornadas Existentes</label>
              {jornadas.length === 0 ? <p className="text-sm text-slate-500">No hay jornadas creadas.</p> : (
                <ul className="space-y-1">
                  {jornadas.map(j => (
                    <li key={j.id} className="text-sm text-white flex justify-between items-center bg-slate-800 p-2 rounded">
                      <span>{j.nombre}</span>
                      <span className={`text-xs px-2 py-1 rounded ${j.estado === 'abierta' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>{j.estado}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* NUEVO: CONTROL DE INSCRIPCIONES Y PAGOS */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg mb-6">
          <h2 className="text-xl font-bold mb-6 text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5"/> Acreditación de Porotos (Pagos)
          </h2>
          {inscripciones.length === 0 ? (
            <div className="text-center py-6 bg-slate-900 rounded-xl border border-slate-700">
              <p className="text-slate-500 text-sm">No hay solicitudes de participación pendientes ni pagadas aún.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-slate-900 rounded-xl border border-slate-700">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="p-4">Jugador</th>
                    <th className="p-4">Jornada</th>
                    <th className="p-4">Estado de Pago</th>
                    <th className="p-4">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {inscripciones.map(ins => {
                    // Buscamos el nombre del jugador en el historial de pronósticos
                    const jugador = jugadores.find(j => j.id === ins.usuario_id);
                    // Si es nuevo (como Rosita) y no tiene pronósticos previos, mostramos su ID temporalmente
                    const nombreMostrar = jugador ? jugador.alias : `Usuario Nuevo (${ins.usuario_id.split('-')[0]})`;

                    return (
                      <tr key={ins.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-bold text-white">{nombreMostrar}</td>
                        <td className="p-4 text-indigo-400 font-semibold">{ins.jornadas?.nombre || 'Desconocida'}</td>
                        <td className="p-4">
                          {ins.pagado ? (
                            <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">PAGADO</span>
                          ) : (
                            <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">PENDIENTE</span>
                          )}
                        </td>
                        <td className="p-4">
                          <button 
                            onClick={() => togglePago(ins.id, ins.pagado)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${ins.pagado ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'}`}
                          >
                            {ins.pagado ? 'Revocar' : 'Acreditar Poroto'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg h-fit">
            <h2 className="text-xl font-bold mb-6 text-emerald-400 flex items-center gap-2">
              <PlusCircle className="w-5 h-5"/> Crear Nuevo Partido
            </h2>
            <form onSubmit={cargarNuevoPartido} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-1">Jornada</label>
                <select required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none" value={jornadaSeleccionada} onChange={(e) => setJornadaSeleccionada(e.target.value)}>
                  <option value="">Seleccioná una jornada...</option>
                  {jornadas.map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}
                </select>
              </div>
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
              </div>
              <button type="submit" disabled={guardandoPartido || jornadas.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-2 disabled:opacity-50">
                {jornadas.length === 0 ? "Primero creá una jornada" : (guardandoPartido ? "Publicando partido..." : "Publicar Partido")}
              </button>
            </form>
          </div>

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
                       <span className="text-xs text-indigo-400 font-bold uppercase block mb-1">
                         {partido.jornadas?.nombre || 'Sin Jornada'}
                       </span>
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
                    <button onClick={() => alert("Para bloquear ir a Supabase > Authentication")} className="bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-500 border border-slate-700 hover:border-amber-500/50 p-2 rounded-lg transition-colors" title="Bloquear cuenta">
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