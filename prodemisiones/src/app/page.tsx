import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-700 flex flex-col items-center">
        <Image 
          src="/logo.jpg" 
          alt="Prode Misiones Logo" 
          width={400} 
          height={225} 
          className="rounded-lg shadow-2xl mb-6 w-full object-cover"
        />
        
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