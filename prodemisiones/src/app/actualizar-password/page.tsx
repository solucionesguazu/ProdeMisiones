"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { Key } from "lucide-react";

export default function ActualizarPassword() {
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: "error" | "exito" } | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    // Verificamos que el usuario realmente haya llegado a través del enlace de recuperación
    const verificarSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMensaje({ texto: "El enlace es inválido o ha expirado. Solicitá uno nuevo.", tipo: "error" });
      }
    };
    verificarSesion();
  }, []);

  const handleActualizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    if (nuevaPassword !== confirmarPassword) {
      setMensaje({ texto: "Las contraseñas no coinciden.", tipo: "error" });
      setLoading(false);
      return;
    }
    
    if (nuevaPassword.length < 6) {
      setMensaje({ texto: "La contraseña debe tener al menos 6 caracteres.", tipo: "error" });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: nuevaPassword
    });

    if (error) {
      setMensaje({ texto: error.message, tipo: "error" });
    } else {
      setMensaje({ texto: "¡Contraseña actualizada con éxito! Redirigiendo...", tipo: "exito" });
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-2 text-center flex items-center justify-center gap-2">
          <Key className="w-6 h-6 text-emerald-400" /> Restablecer Contraseña
        </h2>
        <p className="text-slate-400 text-sm text-center mb-6">
          Ingresá tu nueva contraseña para acceder a la plataforma.
        </p>

        {mensaje && (
          <div className={`p-4 rounded-lg mb-6 text-sm border ${mensaje.tipo === 'error' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-emerald-500/10 border-emerald-500 text-emerald-500'}`}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleActualizar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nueva contraseña</label>
            <input
              type="password"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Confirmar nueva contraseña</label>
            <input
              type="password"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-4 rounded-lg transition-colors mt-6 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>
      </div>
    </main>
  );
}