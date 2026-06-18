/**
 * Configuração central da agenda da sala de reunião.
 *
 * Alterar os valores aqui reflete automaticamente em toda a aplicação:
 * formulário de novo agendamento, grade de horários da agenda e nas
 * regras de conflito calculadas no front-end.
 *
 * A garantia definitiva contra sobreposição de horários vive no banco
 * de dados, na exclusion constraint (migrations/001 + 002) — os valores
 * abaixo precisam ficar em sincronia manual com aquele SQL caso sejam
 * alterados.
 *
 * Não há mais buffer entre reservas (removido na migration 002): duas
 * reservas só conflitam se os horários realmente se sobrepõem. O
 * horário é livre dentro do expediente (qualquer minuto, ex.: 15:02).
 */
export const AGENDA_CONFIG = {
  /** Horário de início do expediente, no formato "HH:mm". */
  EXPEDIENTE_INICIO: "08:00",
  /** Horário de fim do expediente, no formato "HH:mm". */
  EXPEDIENTE_FIM: "17:00",
  /** Passo dos botões "+/-" do campo de hora, em minutos. */
  SLOT_MINUTOS: 30,
} as const;

/** Converte "HH:mm" em minutos desde 00:00. */
export function horaParaMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/** Converte minutos desde 00:00 em "HH:mm". */
export function minutosParaHora(minutos: number): string {
  const h = Math.floor(minutos / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutos % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export const EXPEDIENTE_INICIO_MIN = horaParaMinutos(
  AGENDA_CONFIG.EXPEDIENTE_INICIO
);
export const EXPEDIENTE_FIM_MIN = horaParaMinutos(AGENDA_CONFIG.EXPEDIENTE_FIM);

/** Lista de horários "HH:mm" do expediente, espaçados por SLOT_MINUTOS. */
export function gerarSlotsExpediente(): string[] {
  const slots: string[] = [];
  for (
    let m = EXPEDIENTE_INICIO_MIN;
    m < EXPEDIENTE_FIM_MIN;
    m += AGENDA_CONFIG.SLOT_MINUTOS
  ) {
    slots.push(minutosParaHora(m));
  }
  return slots;
}

/**
 * Todas as fronteiras de horário do expediente, incluindo o fim
 * (ex.: 08:00, 08:30, ..., 17:00) — usado para popular as opções de
 * hora de término no formulário (que pode terminar exatamente no
 * fim do expediente, diferente do horário de início).
 */
export function gerarLimitesExpediente(): string[] {
  const limites: string[] = [];
  for (
    let m = EXPEDIENTE_INICIO_MIN;
    m <= EXPEDIENTE_FIM_MIN;
    m += AGENDA_CONFIG.SLOT_MINUTOS
  ) {
    limites.push(minutosParaHora(m));
  }
  return limites;
}
