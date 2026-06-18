import { AGENDA_CONFIG, horaParaMinutos } from "@/config/agenda";

export interface IntervaloReserva {
  hora_inicio: string; // "HH:mm" ou "HH:mm:ss"
  hora_fim: string;
}

/**
 * Infla o fim de um intervalo pelo buffer de tolerância, em minutos
 * desde 00:00 — mesma transformação que a coluna gerada
 * `periodo_com_buffer` aplica no banco (migrations/001_init.sql).
 */
function paraRangeComBuffer(intervalo: IntervaloReserva) {
  return {
    inicio: horaParaMinutos(intervalo.hora_inicio.slice(0, 5)),
    fim:
      horaParaMinutos(intervalo.hora_fim.slice(0, 5)) +
      AGENDA_CONFIG.BUFFER_MINUTOS,
  };
}

/**
 * Réplica em JS, para feedback instantâneo no formulário, da mesma
 * regra de sobreposição que a EXCLUSION CONSTRAINT garante no banco:
 * dois intervalos conflitam se os ranges [início, fim+buffer) se
 * cruzam. Esta função é só uma conveniência de UX — a fonte da
 * verdade contra conflito de horário é sempre o banco de dados.
 */
export function intervalosConflitam(
  a: IntervaloReserva,
  b: IntervaloReserva
): boolean {
  const ra = paraRangeComBuffer(a);
  const rb = paraRangeComBuffer(b);
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
