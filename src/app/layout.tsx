import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/components/pwa-register";
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
  title: "SalaLivre — Agenda da sala de reunião",
  description:
    "Sistema interno de agendamento de uma sala de reunião de uso exclusivo.",
  // Manifest é servido automaticamente por src/app/manifest.ts.
  applicationName: "SalaLivre",
  appleWebApp: {
    capable: true,
    title: "SalaLivre",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

// theme-color (cor da barra do sistema quando instalado) e suporte a
// safe-areas (notch) via viewportFit. Cores provisórias — atualizar no
// redesign junto com a nova paleta.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <PwaRegister />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
