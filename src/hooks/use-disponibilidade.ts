"use client";

import { useEffect, useState } from "react";

export interface ConflitoReserva {
  id: string;
  nome_responsavel: string;
  setor: string;
  hora_inicio: string;
  hora_fim: string;
}

type StatusDisponibilidade = "ocioso" | "verificando" | "livre" | "conflito" | "erro";

interface UseDisponibilidadeParams {
  /** "YYYY-MM-DD" */
  data?: string;
  /** "HH:mm" */
  horaInicio?: string;
  /** "HH:mm" */
  horaFim?: string;
  /** id da própria reserva, ao editar (não conflita consigo mesma) */
  excluirId?: string;
}

/**
 * Consulta GET /api/disponibilidade com debounce, para dar feedback
 * em tempo real no formulário ANTES de submeter. Puramente cosmético —
 * a garantia real contra conflito é a exclusion constraint do banco.
 */
export function useDisponibilidade({
  data,
  horaInicio,
  horaFim,
  excluirId,
}: UseDisponibilidadeParams) {
  const [status, setStatus] = useState<StatusDisponibilidade>("ocioso");
  const [conflitos, setConflitos] = useState<ConflitoReserva[]>([]);

  useEffect(() => {
    if (!data || !horaInicio || !horaFim || horaFim <= horaInicio) {
      setStatus("ocioso");
      setConflitos([]);
      return;
    }

    let cancelado = false;
    setStatus("verificando");

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          data,
          hora_inicio: horaInicio,
          hora_fim: horaFim,
        });
        if (excluirId) params.set("excluir_id", excluirId);

        const resposta = await fetch(`/api/disponibilidade?${params.toString()}`);
        if (!resposta.ok) throw new Error("Falha ao checar disponibilidade.");

        const json = await resposta.json();
        if (cancelado) return;

        setConflitos(json.conflitos ?? []);
        setStatus(json.livre ? "livre" : "conflito");
      } catch {
        if (!cancelado) setStatus("erro");
      }
    }, 400);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [data, horaInicio, horaFim, excluirId]);

  return { status, conflitos };
}
