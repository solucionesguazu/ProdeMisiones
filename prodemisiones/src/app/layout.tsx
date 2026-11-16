import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
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
  title: "Prode Misiones",
  description: "Jugá al prode con tus amigos",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const enMantenimiento = process.env.NEXT_PUBLIC_MANTENIMIENTO === "true";

  return (
    <html
      lang="es"
      translate="no"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {enMantenimiento ? (
        <body className="min-h-screen flex items-center justify-center bg-slate-900 p-4 sm:p-8">
          <div className="w-full max-w-4xl flex flex-col items-center justify-center gap-6">
            <Image
              src="/Prode Misiones en mantenimiento.png"
              alt="Prode Misiones en mantenimiento"
              width={1200}
              height={675}
              priority
              className="w-full h-auto rounded-3xl shadow-2xl border-4 border-amber-500/50"
            />
          </div>
        </body>
      ) : (
        <body className="min-h-full flex flex-col bg-slate-900 text-white">
          <div className="flex-grow">{children}</div>

          <footer className="w-full text-center py-6 text-xs text-slate-400 tracking-widest font-medium select-none bg-slate-900 border-t border-slate-800">
            Soluciones Guazu | Asistencia: 3764-803852
          </footer>
        </body>
      )}
    </html>
  );
}