import type { MetadataRoute } from "next";

/**
 * Web App Manifest (PWA) — torna o SalaLivre instalável no celular:
 * ícone na tela inicial, abertura em tela cheia (standalone) e splash.
 * `start_url` aponta para /agenda (tela principal de quem tem a senha);
 * quem não tem sessão cai no /login automaticamente pelo middleware.
 *
 * Cores provisórias (placeholder) — devem ser atualizadas junto com a
 * nova paleta no redesign.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SalaLivre — Agenda da sala de reunião",
    short_name: "SalaLivre",
    description:
      "Agendamento da sala de reunião: consulte, crie e gerencie reservas.",
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/agenda",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#4f46e5",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
