"use client";

import { useEffect } from "react";

/**
 * Registra o service worker (/sw.js) no client, depois que a página
 * carrega, para habilitar a PWA (instalação + fallback offline). Sem
 * UI — apenas efeito colateral. Em dev o registro também funciona, mas
 * o cache só importa de fato em produção.
 */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const registrar = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Falha no registro não deve quebrar o app — silenciar.
      });
    };

    if (document.readyState === "complete") {
      registrar();
    } else {
      window.addEventListener("load", registrar);
      return () => window.removeEventListener("load", registrar);
    }
  }, []);

  return null;
}
