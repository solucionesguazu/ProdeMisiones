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
  title: "Prode Misiones",
  description: "Jugá al prode con tus amigos",
};

export default function RootLayout({ children }: any) {
  return (
    <html
      lang="es"
      translate="no"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-900">
        <div className="flex-grow">
          {children}
        </div>
        
        {/* Firma elegante y discreta al final de la página */}
        <footer className="w-full text-center py-6 text-[11px] text-slate-600/60 tracking-widest font-medium select-none">
          soluciones Guazu. tel:3764-803852
        </footer>
      </body>
    </html>
  );
}