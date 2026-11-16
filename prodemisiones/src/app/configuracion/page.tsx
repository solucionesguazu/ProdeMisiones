"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Lock, Calendar, AlertTriangle } from "lucide-react";

function calcularEdad(fechaNac: string): number | null {
  if (!fechaNac) return null;
  const hoy = new Date();
  const nac = new Date(`${fechaNac}T00:00:00`);
  if (Number.isNaN(nac.getTime())) return null;
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
    edad--;
  }
  return edad;
}

export default function Configuracion() {
  const [userId, setUserId] = useState<string>("");
  const [nombreActual, setNombreActual] = useState<string>("");
  const [nuevoNombre, setNuevoNombre] = useState<string>("");
  const [confirmarNombre, setConfirmarNombre] = useState<string>("");

  const [nuevaPassword, setNuevaPassword] = useState<string>("");
  const [confirmarPassword, setConfirmarPassword] = useState<string>("");

  const [fechaNacimiento, setFechaNacimiento] = useState<string>("");
  const [nuevaFechaNacimiento, setNuevaFechaNacimiento] = useState<string>("");

  const [msgPerfil, setMsgPerfil] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);
  const [msgPass, setMsgPass] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);
  const [msgEdad, setMsgEdad] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);

  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [guardandoPass, setGuardandoPass] = useState(false);
  const [guardandoEdad, setGuardandoEdad] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const cargarUsuario = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      const nombre =
        (user.user_metadata?.nombre as string | undefined)?.trim() ||
        user.email?.split("@")[0] ||
        "Jugador";
      setNombreActual(nombre);

      const fnac = (user.user_metadata?.fecha_nacimiento as string | undefined) || "";
      setFechaNacimiento(fnac);
      setNuevaFechaNacimiento(fnac);
    };

    cargarUsuario();
  }, [router]);

  const handleActualizarNombre = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgPerfil(null);

    const limpio = nuevoNombre.trim();
    if (limpio.length < 2 || limpio.length > 30) {
      setMsgPerfil({
        tipo: "err",
        texto: "El nombre debe tener entre 2 y 30 caracteres.",
      });
      return;
    }

    if (limpio !== confirmarNombre.trim()) {
      setMsgPerfil({ tipo: "err", texto: "Los nombres ingresados no coinciden." });
      return;
    }

    setGuardandoPerfil(true);
    const { error } = await supabase.auth.updateUser({
      data: { nombre: limpio },
    });

    if (error) {
      setMsgPerfil({ tipo: "err", texto: "No se pudo actualizar el nombre." });
    } else {
      setNombreActual(limpio);
      setNuevoNombre("");
      setConfirmarNombre("");
      setMsgPerfil({ tipo: "ok", texto: "Nombre actualizado correctamente." });
    }
    setGuardandoPerfil(false);
  };

  const handleActualizarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgPass(null);

    if (nuevaPassword.length < 6) {
      setMsgPass({
        tipo: "err",
        texto: "La nueva contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setMsgPass({ tipo: "err", texto: "Las contraseñas no coinciden." });
      return;
    }

    setGuardandoPass(true);
    const { error } = await supabase.auth.updateUser({
      password: nuevaPassword,
    });

    if (error) {
      setMsgPass({
        tipo: "err",
        texto: "No se pudo cambiar la contraseña. Intentá cerrando y abriendo sesión.",
      });
    } else {
      setNuevaPassword("");
      setConfirmarPassword("");
      setMsgPass({ tipo: "ok", texto: "Contraseña actualizada con éxito." });
    }
    setGuardandoPass(false);
  };

  const handleActualizarEdad = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgEdad(null);

    const edad = calcularEdad(nuevaFechaNacimiento);
    if (edad === null || edad < 18 || edad > 110) {
      setMsgEdad({
        tipo: "err",
        texto: "Debés ser mayor de 18 años para participar en Prode Misiones.",
      });
      return;
    }

    setGuardandoEdad(true);
    const { error } = await supabase.auth.updateUser({
      data: { fecha_nacimiento: nuevaFechaNacimiento },
    });

    if (error) {
      setMsgEdad({
        tipo: "err",
        texto: "No se pudo actualizar la fecha de nacimiento.",
      });
    } else {
      setFechaNacimiento(nuevaFechaNacimiento);
      setMsgEdad({ tipo: "ok", texto: "Edad actualizada correctamente." });
    }
    setGuardandoEdad(false);
  };

  const handleEliminarCuenta = async () => {
    if (!userId || eliminando) return;
    setEliminando(true);

    await supabase.from("pronosticos").delete().eq("usuario_id", userId);
    await supabase.from("inscripciones").delete().eq("usuario_id", userId);
    await supabase.auth.signOut();
    router.push("/");
  };

  const edadActual = calcularEdad(fechaNacimiento);

  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-slate-300 hover:text-white bg-slate-800 px-4 py-2 rounded-lg text-sm font-bold border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Tablero
          </Link>
          <h1 className="text-xl sm:text-2xl font-extrabold text-emerald-400">
            Configuración
          </h1>
        </div>

        {/* TARJETA 1: PERFIL */}
        <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" /> Mi Perfil
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Nombre actual en el ranking:{" "}
            <strong className="text-white">{nombreActual}</strong>
          </p>

          {msgPerfil && (
            <div
              className={`p-3 rounded-lg mb-4 text-xs font-semibold ${
                msgPerfil.tipo === "ok"
                  ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400"
                  : "bg-red-500/15 border border-red-500/40 text-red-400"
              }`}
            >
              {msgPerfil.texto}
            </div>
          )}

          <form onSubmit={handleActualizarNombre} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nuevo nombre
              </label>
              <input
                type="text"
                maxLength={30}
                required
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Confirmar nuevo nombre
              </label>
              <input
                type="text"
                maxLength={30}
                required
                value={confirmarNombre}
                onChange={(e) => setConfirmarNombre(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="Repetí el nuevo nombre"
              />
            </div>
            <button
              type="submit"
              disabled={guardandoPerfil}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {guardandoPerfil ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </section>

        {/* TARJETA 2: CONTRASEÑA */}
        <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" /> Seguridad y Contraseña
          </h2>

          {msgPass && (
            <div
              className={`p-3 rounded-lg mb-4 text-xs font-semibold ${
                msgPass.tipo === "ok"
                  ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400"
                  : "bg-red-500/15 border border-red-500/40 text-red-400"
              }`}
            >
              {msgPass.texto}
            </div>
          )}

          <form onSubmit={handleActualizarPassword} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nueva contraseña
              </label>
              <input
                type="password"
                minLength={6}
                required
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Confirmar nueva contraseña
              </label>
              <input
                type="password"
                minLength={6}
                required
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="Repetí la nueva contraseña"
              />
            </div>
            <button
              type="submit"
              disabled={guardandoPass}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {guardandoPass ? "Cambiando..." : "Cambiar contraseña"}
            </button>
          </form>
        </section>

        {/* TARJETA 3: EDAD */}
        <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" /> Edad (+18)
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Edad registrada:{" "}
            <strong className="text-white">
              {edadActual !== null ? `${edadActual} años` : "Sin registrar"}
            </strong>
          </p>

          {msgEdad && (
            <div
              className={`p-3 rounded-lg mb-4 text-xs font-semibold ${
                msgEdad.tipo === "ok"
                  ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400"
                  : "bg-red-500/15 border border-red-500/40 text-red-400"
              }`}
            >
              {msgEdad.texto}
            </div>
          )}

          <form onSubmit={handleActualizarEdad} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                required
                value={nuevaFechaNacimiento}
                onChange={(e) => setNuevaFechaNacimiento(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none [color-scheme:dark]"
              />
            </div>
            <button
              type="submit"
              disabled={guardandoEdad}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {guardandoEdad ? "Guardando..." : "Guardar fecha"}
            </button>
          </form>
        </section>

        {/* TARJETA 4: ZONA DE PELIGRO */}
        <section className="bg-slate-800 p-6 rounded-2xl border border-red-500/40 shadow-lg">
          <h2 className="text-lg font-bold text-red-400 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Zona de Peligro
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Al dar de baja tu participación se eliminan tus pronósticos cargados
            y se cierra tu sesión. Esta acción no se puede deshacer.
          </p>

          {!confirmarEliminar ? (
            <button
              onClick={() => setConfirmarEliminar(true)}
              className="bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/40 font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              Eliminar mi participación
            </button>
          ) : (
            <div className="bg-red-950/40 border border-red-500/40 p-4 rounded-xl space-y-3">
              <p className="text-xs text-red-200 font-semibold">
                ¿Confirmás que querés borrar todos tus pronósticos y salir del
                torneo?
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleEliminarCuenta}
                  disabled={eliminando}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors disabled:opacity-50"
                >
                  {eliminando ? "Eliminando..." : "Sí, confirmar baja"}
                </button>
                <button
                  onClick={() => setConfirmarEliminar(false)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold px-4 py-2 rounded-lg text-xs transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}