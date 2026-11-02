"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Registro() {
  const [nombre, setNombre] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (calcularEdad(fechaNacimiento) < 18) {
      setError("Debés ser mayor de 18 años para participar en el Prode.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre: nombre,
          fecha_nacimiento: fechaNacimiento,
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver al inicio
        </Link>

        <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Crear Cuenta
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {success ? (
            <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-500 p-6 rounded-lg text-center">
              <h3 className="font-bold text-lg mb-2">¡Cuenta creada!</h3>
              <p className="text-sm mb-4">Ya podés iniciar sesión en la plataforma.</p>
              <Link
                href="/login"
                className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Ir a Iniciar Sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRegistro} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Nombre o Nickname
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Ej: Juan, ElKun..."
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
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Contraseña (mínimo 6 caracteres)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-4 rounded-lg transition-colors mt-6 disabled:opacity-50"
              >
                {loading ? "Registrando..." : "Registrarme"}
              </button>
            </form>
          )}

          {!success && (
            <p className="text-slate-400 text-center mt-6 text-sm">
              ¿Ya tenés cuenta?{" "}
              <Link href="/login" className="text-emerald-400 hover:underline">
                Iniciá sesión acá
              </Link>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}