"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Configuracion() {
  const [nombre, setNombre] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: "error" | "exito" } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const cargarPerfil = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Carga los datos actuales si existen
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

  const handleActualizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    if (calcularEdad(fechaNacimiento) < 18) {
      setMensaje({ texto: "Debés ser mayor de 18 años.", tipo: "error" });
      setLoading(false);
      return;
    }

    // Preparamos los datos a actualizar
    const actualizaciones: any = {
      data: {
        nombre: nombre,
        fecha_nacimiento: fechaNacimiento,
      }
    };

    // Solo enviamos la contraseña si el usuario escribió una nueva
    if (password.trim() !== "") {
      if (password.length < 6) {
        setMensaje({ texto: "La nueva contraseña debe tener al menos 6 caracteres.", tipo: "error" });
        setLoading(false);
        return;
      }
      actualizaciones.password = password;
    }

    const { error } = await supabase.auth.updateUser(actualizaciones);

    if (error) {
      setMensaje({ texto: error.message, tipo: "error" });
    } else {
      setMensaje({ texto: "¡Perfil actualizado con éxito!", tipo: "exito" });
      setPassword(""); // Limpiamos el campo de contraseña
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver al panel
        </Link>

        <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Configuración de Perfil
          </h2>

          {mensaje && (
            <div className={`p-4 rounded-lg mb-6 text-sm border ${mensaje.tipo === 'error' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-emerald-500/10 border-emerald-500 text-emerald-500'}`}>
              {mensaje.texto}
            </div>
          )}

          <form onSubmit={handleActualizar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Nombre o Nickname
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Nueva Contraseña <span className="text-slate-500 text-xs">(Opcional)</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Dejar en blanco para no cambiar"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-4 rounded-lg transition-colors mt-6 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}