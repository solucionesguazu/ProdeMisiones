import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Reglas() {
  return (
    <main className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl mt-8">
        <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver al panel
        </Link>
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl">
          <h1 className="text-2xl font-bold text-emerald-400 mb-6">Reglas del Juego</h1>
          <ul className="space-y-4 text-slate-300">
            <li><strong className="text-white">6 puntos:</strong> Acierto del resultado exacto[cite: 1].</li>
            <li><strong className="text-white">3 puntos:</strong> Acierto del resultado general (ganador o empate), pero sin acertar el marcador exacto[cite: 1].</li>
            <li><strong className="text-white">0 puntos:</strong> Pronóstico incorrecto[cite: 1].</li>
          </ul>
          <p className="mt-8 text-sm text-slate-500">Otras normativas en desarrollo...</p>
        </div>
      </div>
    </main>
  );
}