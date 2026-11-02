import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-700">
        <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
          PRODE <span className="text-emerald-400">MISIONES</span>
        </h1>
        <p className="text-slate-400 mb-8">
          Demostrá cuánto sabés de fútbol y competí con tus amigos.
        </p>
        
        <Link href="/login" className="w-full block bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 px-4 rounded-lg transition-colors mb-4 text-center">
          Iniciar Sesión
        </Link>
        
        <Link href="/registro" className="w-full block bg-transparent hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg border border-slate-600 transition-colors text-center">
          Crear Cuenta
        </Link>
      </div>
    </main>
  );
}