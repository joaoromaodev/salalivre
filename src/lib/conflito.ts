import { horaParaMinutos } from "@/config/agenda";

export interface IntervaloReserva {
  hora_inicio: string; // "HH:mm" ou "HH:mm:ss"
  hora_fim: string;
}

/** Intervalo da reserva em minutos desde 00:00, como range [início, fim). */
function paraRange(intervalo: IntervaloReserva) {
  return {
    inicio: horaParaMinutos(intervalo.hora_inicio.slice(0, 5)),
    fim: horaParaMinutos(intervalo.hora_fim.slice(0, 5)),
  };
}

/**
 * Réplica em JS, para feedback instantâneo no formulário, da mesma
 * regra de sobreposição que a EXCLUSION CONSTRAINT garante no banco:
 * dois intervalos [início, fim) conflitam se de fato se cruzam (sem
 * buffer). Reservas encostadas (uma termina quando a outra começa) NÃO
 * conflitam. Esta função é só conveniência de UX — a fonte da verdade
 * contra conflito de horário é sempre o banco de dados.
 */
export function intervalosConflitam(
  a: IntervaloReserva,
  b: IntervaloReserva
): boolean {
  const ra = paraRange(a);
  const rb = paraRange(b);
  return ra.inicio < rb.fim && rb.inicio < ra.fim;
}

/** Retorna, dentre `reservasDoDia`, as que conflitam com `proposta`. */
export function encontrarConflitos<
  T extends IntervaloReserva & { id: string }
>(proposta: IntervaloReserva, reservasDoDia: T[], ignorarId?: string): T[] {
  return reservasDoDia.filter(
    (reserva) =>
      reserva.id !== ignorarId && intervalosConflitam(proposta, reserva)
  );
}
