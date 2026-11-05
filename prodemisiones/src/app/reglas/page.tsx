import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";

export default function Reglas() {
  return (
    <main className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl mt-8 mb-20">
        <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver al panel
        </Link>
        
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl space-y-8">
          <h1 className="text-3xl font-extrabold text-emerald-400 mb-6 text-center">
            REGLAMENTO OFICIAL DEL PRODE MISIONES
          </h1>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Participación</h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              <li>La participación en el Prode implica la aceptación total de las presentes reglas y condiciones.</li>
              <li>El valor de cada poroto (inscripción por fecha) es de $3.000 (tres mil pesos argentinos).</li>
              <li>La participación quedará confirmada únicamente una vez acreditado el pago correspondiente.</li>
              <li>Cada usuario será responsable de realizar sus pronósticos antes del inicio de los partidos incluidos en la fecha correspondiente.</li>
              <li>No se permitirán modificaciones una vez comenzado el encuentro.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Sistema de Puntaje</h2>
            <p className="text-slate-300 mb-2">Los puntos se otorgarán de la siguiente manera:</p>
            <ul className="list-none space-y-2 text-slate-300">
              <li><strong className="text-emerald-400">6 puntos:</strong> Acierto exacto del resultado (marcador correcto).</li>
              <li><strong className="text-emerald-400">3 puntos:</strong> Acierto del resultado general (victoria local, empate o victoria visitante) sin acertar el marcador exacto.</li>
              <li><strong className="text-emerald-400">0 puntos:</strong> Pronóstico incorrecto.</li>
            </ul>
            <p className="text-slate-300 mt-2">La tabla de posiciones se actualizará automáticamente una vez que los resultados oficiales de cada encuentro sean registrados en el sistema.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Premios</h2>
            <p className="text-slate-300 mb-2">Al finalizar cada fecha del fútbol argentino se realizará la clasificación de todos los participantes.</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              <li><strong className="text-white">Primer Premio:</strong> $30.000 (treinta mil pesos argentinos).</li>
              <li>Los premios serán abonados una vez finalizada y validada oficialmente la fecha correspondiente.</li>
              <li>La organización se reserva el derecho de verificar resultados y cálculos antes de efectuar cualquier pago.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Determinación de Ganadores</h2>
            <p className="text-slate-300 mb-2">Será declarado ganador de la fecha el participante que acumule la mayor cantidad de puntos.</p>
            <p className="text-slate-300 mb-2 font-semibold">En caso de empate entre dos o más participantes:</p>
            <ol className="list-decimal pl-5 space-y-2 text-slate-300">
              <li>Ganará quien haya acertado más resultados exactos.</li>
              <li>Si persiste el empate, se tendrá en cuenta la cantidad de partidos acertados.</li>
              <li>Si aún existiera igualdad absoluta, el premio podrá dividirse en partes iguales entre los participantes empatados o resolverse mediante el criterio que la organización informe previamente.</li>
            </ol>
            <p className="text-slate-300 mt-2">La decisión final de la organización respecto de los empates será considerada válida y definitiva.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Resultados Oficiales</h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              <li>Todos los resultados utilizados para el cálculo del puntaje serán los resultados oficiales registrados al finalizar cada partido.</li>
              <li>La organización tomará como referencia fuentes oficiales y reconocidas del fútbol argentino.</li>
              <li>Cualquier corrección estadística posterior realizada por medios periodísticos, aplicaciones deportivas o terceros no modificará los puntos ya asignados una vez cerrada la fecha.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Partidos con Tiempo Suplementario y Penales</h2>
            <p className="text-slate-300 mb-2">Para todos los partidos incluidos en el Prode:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300 mb-4">
              <li>Se tomará como válido el resultado oficial existente al finalizar el encuentro, incluyendo el tiempo suplementario cuando corresponda.</li>
              <li>En caso de definición por penales, la tanda de penales NO será considerada para el resultado del Prode.</li>
              <li>El marcador válido será el resultado con el que finalice el partido antes de iniciar la tanda de penales, ya sea a los 90 minutos reglamentarios o a los 120 minutos cuando exista tiempo suplementario.</li>
            </ul>
            <p className="text-slate-300 font-semibold mb-2">Ejemplos:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              <li>Si un partido termina 1-1 y luego un equipo gana por penales, el resultado válido para el Prode será 1-1.</li>
              <li>Si un partido finaliza 2-2 tras el tiempo suplementario y posteriormente se define por penales, el resultado válido para el Prode será 2-2.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Conducta y Transparencia</h2>
            <p className="text-slate-300 space-y-2">
              La organización se compromete a administrar el Prode de manera transparente, objetiva y equitativa para todos los participantes. No se admitirán reclamos basados en interpretaciones personales de las reglas. Cualquier situación no contemplada expresamente será resuelta por la organización de acuerdo con criterios de buena fe y transparencia.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Deslinde de Responsabilidad</h2>
            <p className="text-slate-300 mb-2">
              La organización actúa exclusivamente como administradora del juego de pronósticos deportivos. La participación es voluntaria y cada participante acepta las reglas aquí publicadas. La organización no será responsable por:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300 mb-4">
              <li>Errores de conexión a internet.</li>
              <li>Fallas del sistema o del dispositivo utilizado por el participante.</li>
              <li>Cargas de pronósticos incompletas o realizadas fuera de término.</li>
              <li>Problemas ocasionados por terceros, proveedores de internet o plataformas externas.</li>
              <li>Suspensiones, aplazamientos o cancelaciones de partidos por causas ajenas a la organización.</li>
            </ul>
            <p className="text-slate-300">
              Asimismo, la organización se reserva el derecho de modificar, suspender o cancelar cualquier fecha del Prode ante situaciones extraordinarias que pudieran afectar el correcto desarrollo de la competencia. La participación en el Prode implica la aceptación plena de estas condiciones.
            </p>
          </section>

          <div className="border-t border-slate-700 pt-8 text-center">
            <p className="text-red-400 font-bold uppercase tracking-wider mb-6 text-sm">
              ¡Jugar compulsivamente es perjudicial para la Salud!
            </p>
            
            <h3 className="text-lg font-bold text-white mb-4">Dudas y consultas:</h3>
            <a 
              href="https://wa.me/5493764803852?text=Hola,%20te%20comunicaste%20con%20el%20centro%20de%20asistencia%20de%20PRODE%20MISIONES,%20d%C3%A9janos%20tu%20consulta%20y%20te%20responderemos%20a%20la%20brevedad"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg w-full sm:w-auto"
            >
              <MessageCircle className="w-6 h-6" />
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}