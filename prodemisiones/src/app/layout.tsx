import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prode Misiones | En Mantenimiento",
  description: "Estamos renovando la cancha. Volvemos pronto.",
};

export default function RootLayout({ children }: any) {
  return (
    <html
      lang="es"
      translate="no"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex items-center justify-center bg-slate-900 p-4 sm:p-8">
        <div className="w-full max-w-5xl flex items-center justify-center animate-pulse">
          {/* Se usa %20 para reemplazar los espacios en el nombre de tu archivo */}
          <img 
            src="/Prode%20Misiones%20en%20mantenimiento.png" 
            alt="Sitio en mantenimiento" 
            className="w-full h-auto rounded-3xl shadow-2xl border-4 border-amber-500/50"
          />
        </div>
      </body>
    </html>
  );
}