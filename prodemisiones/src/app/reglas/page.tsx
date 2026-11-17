import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";

export default function Reglas() {
  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl mt-6 sm:mt-8 mb-20">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver al panel
        </Link>

        <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-700 shadow-xl space-y-8">
          <div className="text-center border-b border-slate-700 pb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
              ⚽ REGLAMENTO OFICIAL DEL PRODE MISIONES
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-2">
              Condiciones generales de participación, puntajes y premios
            </p>
          </div>

          {/* 1. Participación */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🎟️ 1. Participación
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              La participación en Prode Misiones implica la aceptación total e
              incondicional del presente reglamento.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm leading-relaxed">
              <li>
                El valor de cada poroto (inscripción por fecha) es de{" "}
                <strong className="text-white">
                  $3.000 (tres mil pesos argentinos)
                </strong>
                .
              </li>
              <li>
                La adquisición del poroto deberá realizarse mediante
                transferencia al alias:{" "}
                <strong className="text-emerald-400 font-mono select-all">
                  prod-misiones
                </strong>
                .
              </li>
              <li>
                La participación quedará confirmada únicamente una vez enviado
                el comprobante de pago al número{" "}
                <strong className="text-amber-300">3764-803852</strong>.
              </li>
              <li>
                En caso de realizar el pago y no enviar el comprobante
                correspondiente, la inscripción será considerada{" "}
                <strong className="text-red-400">nula</strong>, sin excepción.
              </li>
              <li>
                Cada participante será responsable de verificar que su
                inscripción haya sido validada correctamente antes del cierre de
                la fecha.
              </li>
              <li>
                Los pronósticos deberán cargarse antes del inicio de la jornada
                correspondiente. No se admitirán modificaciones una vez
                comenzado el primer partido de la fecha.
              </li>
            </ul>
          </section>

          {/* 2. Sistema de Puntaje */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🎯 2. Sistema de Puntaje
            </h2>
            <p className="text-slate-300 text-sm">
              Los puntos se otorgarán de la siguiente manera:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-2">
              <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4">
                <span className="text-emerald-400 font-extrabold text-lg block mb-1">
                  🔥 6 puntos
                </span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Acierto exacto del marcador.
                </p>
              </div>
              <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4">
                <span className="text-amber-400 font-extrabold text-lg block mb-1">
                  ✅ 3 puntos
                </span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Acierto del resultado general (victoria local, empate o
                  victoria visitante), sin acertar el marcador exacto.
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <span className="text-slate-400 font-extrabold text-lg block mb-1">
                  ❌ 0 puntos
                </span>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Pronóstico incorrecto.
                </p>
              </div>
            </div>
            <p className="text-slate-400 text-xs">
              Los puntajes serán calculados de manera automática utilizando los
              resultados oficiales de cada encuentro.
            </p>
          </section>

          {/* 3. Premios */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🏆 3. Premios
            </h2>
            <p className="text-slate-300 text-sm">
              Al finalizar cada fecha del fútbol argentino se confeccionará la
              clasificación final de los participantes.
            </p>

            <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-4">
              <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider mb-1">
                🥇 Premio Principal
              </h3>
              <p className="text-white font-extrabold text-lg">
                Primer Premio: $30.000 (treinta mil pesos argentinos).
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-100">
                💳 Condiciones del Premio
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm leading-relaxed">
                <li>
                  El premio será abonado exclusivamente mediante{" "}
                  <strong className="text-white">
                    transferencia bancaria o billetera virtual
                  </strong>
                  . El pago se realizará una vez finalizada y validada
                  oficialmente la fecha correspondiente.
                </li>
                <li>
                  Los premios estarán sujetos a una participación mínima de{" "}
                  <strong className="text-white">
                    10 participantes confirmados
                  </strong>
                  .
                </li>
                <li>
                  La organización podrá verificar resultados, puntajes e
                  inscripciones antes de efectuar cualquier pago.
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-100">
                📈 Crecimiento del Pozo
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Una vez superados los{" "}
                <strong className="text-white">
                  30 participantes confirmados
                </strong>
                , el pozo de premios podrá incrementarse de manera progresiva
                según la cantidad de inscriptos de cada fecha. La organización
                informará oportunamente cualquier incremento en los premios
                antes del inicio de la jornada correspondiente.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-100">
                🛡️ Reserva y Verificación de Pago
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                La organización se reserva el derecho de verificar la identidad
                del ganador, la validez de su inscripción y el cumplimiento de
                todas las condiciones de participación antes de efectuar el pago
                de cualquier premio.
              </p>
              <p className="text-slate-300 text-sm">
                En caso de detectarse irregularidades, incluyendo pero no
                limitándose a:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300 text-sm">
                <li>Utilización de cuentas duplicadas.</li>
                <li>Inscripciones con datos falsos o incompletos.</li>
                <li>Falta de acreditación o validación del pago.</li>
                <li>Manipulación o intento de vulnerar el sistema.</li>
                <li>Incumplimiento de cualquiera de las reglas establecidas.</li>
              </ul>
              <p className="text-slate-300 text-sm leading-relaxed pt-1">
                La organización podrá suspender temporalmente la entrega del
                premio hasta finalizar las verificaciones correspondientes o, de
                comprobarse una infracción, anular la participación y dejar sin
                efecto el derecho al cobro del premio. Asimismo, la organización
                podrá solicitar los datos necesarios para efectuar la
                transferencia y verificar la titularidad de la cuenta receptora
                antes de realizar cualquier pago.
              </p>
            </div>
          </section>

          {/* 4. Determinación de Ganadores */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              ⚖️ 4. Determinación de Ganadores
            </h2>
            <p className="text-slate-300 text-sm">
              Será considerado ganador de la fecha el participante que obtenga
              la mayor cantidad de puntos.
            </p>
            <p className="text-slate-200 text-sm font-semibold">
              En caso de empate:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-slate-300 text-sm">
              <li>
                Tendrá prioridad quien haya acertado más marcadores exactos.
              </li>
              <li>
                Si persiste el empate, se considerará la cantidad total de
                resultados acertados.
              </li>
              <li>
                Si la igualdad continúa, el premio podrá dividirse en partes
                iguales entre los participantes empatados.
              </li>
            </ol>
            <p className="text-slate-400 text-xs">
              La decisión de la administración será considerada válida y
              definitiva.
            </p>
          </section>

          {/* 5. Resultados Oficiales */}
          <section className="space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              📋 5. Resultados Oficiales
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm leading-relaxed">
              <li>
                Todos los resultados utilizados para el cálculo de puntos serán
                aquellos considerados oficiales al finalizar cada encuentro.
              </li>
              <li>
                La organización podrá utilizar como referencia organismos
                oficiales, entidades deportivas reconocidas y plataformas
                estadísticas especializadas.
              </li>
              <li>
                Una vez validada una fecha, no se realizarán modificaciones por
                correcciones estadísticas posteriores.
              </li>
            </ul>
          </section>

          {/* 6. Partidos con Tiempo Suplementario y Penales */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              ⏱️ 6. Partidos con Tiempo Suplementario y Penales
            </h2>
            <p className="text-slate-300 text-sm">
              Para todos los encuentros incluidos en el Prode:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm leading-relaxed">
              <li>
                Si el partido finaliza durante los 90 minutos reglamentarios,
                ese será el resultado considerado.
              </li>
              <li>
                Si el encuentro requiere tiempo suplementario, se tomará como
                válido el resultado existente al finalizar los 120 minutos de
                juego.
              </li>
              <li>
                <strong className="text-white">
                  Las definiciones por penales no serán consideradas para el
                  cálculo de puntos.
                </strong>
              </li>
              <li>
                El resultado válido para el Prode será siempre el marcador
                existente antes de la ejecución de los penales.
              </li>
            </ul>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-1.5 text-xs sm:text-sm text-slate-300">
              <p className="font-bold text-emerald-400 mb-1">📌 Ejemplos:</p>
              <p>
                • Si un partido termina <strong>1-1</strong> y posteriormente un
                equipo gana por penales, el resultado válido para el Prode será{" "}
                <strong className="text-white">1-1</strong>.
              </p>
              <p>
                • Si un partido finaliza <strong>2-2</strong> luego del tiempo
                suplementario y posteriormente se define por penales, el
                resultado válido para el Prode será{" "}
                <strong className="text-white">2-2</strong>.
              </p>
            </div>
          </section>

          {/* 7. Transparencia y Publicación de Resultados */}
          <section className="space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              📢 7. Transparencia y Publicación de Resultados
            </h2>
            <p className="text-slate-300 text-sm">
              Con el objetivo de garantizar la transparencia del juego:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm leading-relaxed">
              <li>
                Los resultados, posiciones y puntajes podrán ser publicados
                públicamente al finalizar cada fecha.
              </li>
              <li>
                Los participantes aceptan la publicación de su nombre de usuario
                y puntaje dentro de las clasificaciones.
              </li>
              <li>
                La administración mantendrá actualizada la información
                correspondiente a cada jornada disputada.
              </li>
            </ul>
          </section>

          {/* 8. Ranking General */}
          <section className="space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              📊 8. Ranking General
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              La administración podrá implementar rankings generales anuales,
              semestrales o por temporada. Estos rankings podrán contar con
              premios adicionales, reconocimientos especiales o beneficios
              determinados por la organización. Las condiciones particulares
              serán comunicadas oportunamente.
            </p>
          </section>

          {/* 9. Restricciones de Participación */}
          <section className="space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🚫 9. Restricciones de Participación
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm leading-relaxed">
              <li>
                Está estrictamente prohibida la creación y utilización de
                cuentas duplicadas. Cada participante podrá competir únicamente
                con una cuenta registrada.
              </li>
              <li>
                Ante la detección de múltiples cuentas pertenecientes a una misma
                persona, la organización podrá anular las participaciones
                involucradas sin obligación de reintegro.
              </li>
              <li>
                Cualquier conducta que busque obtener ventajas indebidas podrá
                derivar en la descalificación inmediata.
              </li>
            </ul>
          </section>

          {/* 10. Fecha Límite de Pago */}
          <section className="space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              ⏰ 10. Fecha Límite de Pago
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              La acreditación del pago y el envío del comprobante deberán
              realizarse como máximo{" "}
              <strong className="text-amber-300">
                30 minutos antes del inicio del primer partido de la fecha
              </strong>
              . Los pagos o comprobantes enviados fuera de dicho plazo podrán
              ser rechazados para la jornada correspondiente.
            </p>
          </section>

          {/* 11. Deslinde de Responsabilidad */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              ⚠️ 11. Deslinde de Responsabilidad
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              La administración de Prode Misiones actúa exclusivamente como
              organizadora de un juego de pronósticos deportivos entre
              participantes. La organización no será responsable por:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300 text-sm">
              <li>Errores de carga de pronósticos.</li>
              <li>Problemas de conexión a internet.</li>
              <li>
                Fallas técnicas de dispositivos, aplicaciones o navegadores.
              </li>
              <li>Comprobantes enviados fuera de término.</li>
              <li>
                Errores cometidos por los participantes al momento de
                registrarse o realizar pagos.
              </li>
              <li>
                Suspensiones, reprogramaciones o cancelaciones de partidos
                dispuestas por organismos externos.
              </li>
              <li>
                Casos de fuerza mayor que impidan el normal desarrollo de la
                competencia.
              </li>
            </ul>
            <p className="text-slate-300 text-sm leading-relaxed pt-1">
              La organización se reserva el derecho de modificar, suspender o
              cancelar cualquier fecha cuando circunstancias extraordinarias lo
              requieran para preservar la transparencia y el correcto
              funcionamiento del Prode. La participación implica la aceptación
              total de todas las reglas y condiciones aquí establecidas.
            </p>
          </section>

          {/* Pie de contacto y juego responsable */}
          <div className="border-t border-slate-700 pt-8 text-center">
            <p className="text-red-400 font-bold uppercase tracking-wider mb-6 text-xs sm:text-sm">
              ¡Jugar compulsivamente es perjudicial para la Salud!
            </p>
            <h3 className="text-lg font-bold text-white mb-4">
              Dudas y envío de comprobantes:
            </h3>
            <a
              href="https://wa.me/5493764803852?text=Hola,%20te%20comunicaste%20con%20el%20centro%20de%20asistencia%20de%20PRODE%20MISIONES,%20d%C3%A9janos%20tu%20consulta%20o%20comprobante%20y%20te%20responderemos%20a%20la%20brevedad"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg w-full sm:w-auto"
            >
              <MessageCircle className="w-6 h-6" />
              Contactar por WhatsApp (3764-803852)
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}