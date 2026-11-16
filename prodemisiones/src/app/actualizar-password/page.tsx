"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";

export default function ActualizarPassword() {
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [sesionLista, setSesionLista] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const verificarSesion = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setSesionLista(true);
      }
      setVerificando(false);
    };

    verificarSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setSesionLista(true);
        setVerificando(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleActualizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (nuevaPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password: nuevaPassword,
    });

    if (updateError) {
      setError("No se pudo actualizar la contraseña. Solicitá un enlace nuevo.");
      setLoading(false);
      return;
    }

    setExito(true);
    setLoading(false);
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver al Login
        </Link>

        <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-500/15 p-3 rounded-full border border-emerald-500/30">
              <KeyRound className="w-6 h-6 text-emerald-400" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 text-center">
            Nueva Contraseña
          </h2>
          <p className="text-slate-400 text-sm text-center mb-6">
            Ingresá tu nueva clave para volver a entrar a Prode Misiones.
          </p>

          {verificando ? (
            <p className="text-center text-slate-400 text-sm animate-pulse">
              Verificando enlace de recuperación...
            </p>
          ) : !sesionLista ? (
            <div className="bg-amber-500/10 border border-amber-500/40 text-amber-300 p-4 rounded-xl text-sm text-center space-y-3">
              <p>
                El enlace de recuperación expiró o no es válido. Solicitá uno
                nuevo desde la pantalla de recuperación.
              </p>
              <Link
                href="/recuperar"
                className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold px-4 py-2 rounded-lg text-xs transition-colors"
              >
                Solicitar nuevo enlace
              </Link>
            </div>
          ) : exito ? (
            <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-4 rounded-xl text-center text-sm font-semibold">
              ¡Contraseña actualizada con éxito! Redirigiendo al tablero...
            </div>
          ) : (
            <form onSubmit={handleActualizar} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  minLength={6}
                  required
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Confirmar nueva contraseña
                </label>
                <input
                  type="password"
                  minLength={6}
                  required
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                  placeholder="Repetí tu nueva contraseña"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-4 rounded-lg transition-colors mt-4 disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar nueva contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}