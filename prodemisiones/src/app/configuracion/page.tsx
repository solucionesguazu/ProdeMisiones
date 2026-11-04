"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { ArrowLeft, User, Key, Calendar, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Configuracion() {
  const [nombre, setNombre] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [confirmarNombre, setConfirmarNombre] = useState("");
  
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  
  const [passwordActual, setPasswordActual] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: "error" | "exito" } | null>(null);
  
  // Estado para la Zona de Peligro
  const [mostrarConfirmacionBorrado, setMostrarConfirmacionBorrado] = useState(false);
  const [loadingBorrado, setLoadingBorrado] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const cargarPerfil = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setNombre(user.user_metadata?.nombre || "");
        setFechaNacimiento(user.user_metadata?.fecha_nacimiento || "");
      } else {
        router.push("/login");
      }
    };
    cargarPerfil();
  }, [router]);

  const calcularEdad = (fecha: string) => {
    const hoy = new Date();
    const nac = new Date(fecha);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const mes = hoy.getMonth() - nac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) {
      edad--;
    }
    return edad;
  };

  const handleActualizarNombre = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    if (nuevoNombre !== confirmarNombre) {
      setMensaje({ texto: "Los nombres no coinciden.", tipo: "error" });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: { nombre: nuevoNombre }
    });

    if (error) {
      setMensaje({ texto: error.message, tipo: "error" });
    } else {
      setNombre(nuevoNombre);
      setNuevoNombre("");
      setConfirmarNombre("");
      setMensaje({ texto: "¡Nombre actualizado con éxito!", tipo: "exito" });
    }
    setLoading(false);
  };

  const handleActualizarEdad = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    if (calcularEdad(fechaNacimiento) < 18) {
      setMensaje({ texto: "Debés ser mayor de 18 años para participar.", tipo: "error" });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: { fecha_nacimiento: fechaNacimiento }
    });

    if (error) {
      setMensaje({ texto: error.message, tipo: "error" });
    } else {
      setMensaje({ texto: "¡Fecha de nacimiento actualizada!", tipo: "exito" });
    }
    setLoading(false);
  };

  const handleActualizarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    if (nuevaPassword !== confirmarPassword) {
      setMensaje({ texto: "Las contraseñas no coinciden.", tipo: "error" });
      setLoading(false);
      return;
    }
    
    if (nuevaPassword.length < 6) {
      setMensaje({ texto: "La nueva contraseña debe tener al menos 6 caracteres.", tipo: "error" });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: nuevaPassword
    });

    if (error) {
      setMensaje({ texto: error.message, tipo: "error" });
    } else {
      setPasswordActual("");
      setNuevaPassword("");
      setConfirmarPassword("");
      setMensaje({ texto: "¡Contraseña cambiada con éxito!", tipo: "exito" });
    }
    setLoading(false);
  };

  const handleEliminarCuenta = async () => {
    setLoadingBorrado(true);
    // Supabase no permite que un usuario se elimine a sí mismo desde el cliente directamente por seguridad sin una Cloud Function, 
    // pero podemos deshabilitar la sesión y enviar la petición (requerirá configurar Edge Functions o que el admin lo borre).
    // Para el flujo visual y MVP:
    const { error } = await supabase.rpc('eliminar_mi_cuenta'); // Función SQL a crear en Supabase si se requiere borrado total.
    
    if (error) {
       // Fallback visual si no tenés la función SQL:
       setMensaje({ texto: "Contactá al administrador para borrar tus datos definitivamente.", tipo: "error" });
       setMostrarConfirmacionBorrado(false);
    } else {
      await supabase.auth.signOut();
      router.push("/");
    }
    setLoadingBorrado(false);
  };

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center p-6 pb-20">
      <div className="w-full max-w-2xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-slate-400 hover:text-white mb-6 mt-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver al panel
        </Link>

        <h2 className="text-3xl font-extrabold text-white mb-8">
          Configuración
        </h2>

        {mensaje && (
          <div className={`p-4 rounded-lg mb-6 text-sm border ${mensaje.tipo === 'error' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-emerald-500/10 border-emerald-500 text-emerald-500'}`}>
            {mensaje.texto}
          </div>
        )}

        <div className="space-y-6">
          {/* Tarjeta Perfil */}
          <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
            <h3 className="text-xl font-bold text-emerald-400 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" /> Mi Perfil
            </h3>
            <p className="text-sm text-slate-400 mb-4">Nombre actual: <span className="text-white font-bold">{nombre}</span></p>
            
            <form onSubmit={handleActualizarNombre} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nuevo nombre</label>
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Confirmar nuevo nombre</label>
                <input
                  type="text"
                  value={confirmarNombre}
                  onChange={(e) => setConfirmarNombre(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                Guardar cambios
              </button>
            </form>
          </section>

          {/* Tarjeta Contraseña */}
          <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
            <h3 className="text-xl font-bold text-emerald-400 mb-4 flex items-center">
              <Key className="w-5 h-5 mr-2" /> Contraseña
            </h3>
            <form onSubmit={handleActualizarPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña actual</label>
                <input
                  type="password"
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Nueva contraseña</label>
                  <input
                    type="password"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                Cambiar contraseña
              </button>
            </form>
          </section>

          {/* Tarjeta Edad */}
          <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
            <h3 className="text-xl font-bold text-emerald-400 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" /> Edad
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Edad actual registrada: <span className="text-white font-bold">{fechaNacimiento ? calcularEdad(fechaNacimiento) : "No definida"} años</span>
            </p>
            <form onSubmit={handleActualizarEdad} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Fecha de nacimiento</label>
                <input
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 focus:border-emerald-500 focus:outline-none [color-scheme:dark]"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                Guardar cambios
              </button>
            </form>
          </section>

          {/* Zona de Peligro */}
          <section className="bg-slate-900 border border-red-900/50 p-6 rounded-2xl mt-12">
            <h3 className="text-xl font-bold text-red-500 mb-2 flex items-center">
              <Trash2 className="w-5 h-5 mr-2" /> Zona de Peligro
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Una vez que elimines tu cuenta, no hay vuelta atrás. Perderás todos tus puntos y pronósticos.
            </p>
            
            {!mostrarConfirmacionBorrado ? (
              <button
                onClick={() => setMostrarConfirmacionBorrado(true)}
                className="bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Eliminar cuenta
              </button>
            ) : (
              <div className="bg-red-500/10 border border-red-500 p-4 rounded-lg">
                <p className="text-white font-bold mb-4">¿Estás completamente seguro?</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleEliminarCuenta}
                    disabled={loadingBorrado}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loadingBorrado ? "Eliminando..." : "Sí, eliminar definitivamente"}
                  </button>
                  <button
                    onClick={() => setMostrarConfirmacionBorrado(false)}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  );
}