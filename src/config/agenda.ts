/**
 * Configuração central da agenda da sala de reunião.
 *
 * Alterar os valores aqui reflete automaticamente em toda a aplicação:
 * formulário de novo agendamento, grade de horários da agenda e nas
 * regras de conflito calculadas no front-end.
 *
 * A garantia definitiva contra sobreposição de horários (com o buffer
 * já embutido) vive no banco de dados, na exclusion constraint da
 * migration `001_init.sql` — os valores abaixo precisam ficar em sincronia
 * manual com aquele SQL caso sejam alterados.
 */
export const AGENDA_CONFIG = {
  /** Horário de início do expediente, no formato "HH:mm". */
  EXPEDIENTE_INICIO: "08:00",
  /** Horário de fim do expediente, no formato "HH:mm". */
  EXPEDIENTE_FIM: "17:00",
  /** Duração de cada slot selecionável no formulário, em minutos. */
  SLOT_MINUTOS: 30,
  /**
   * Tolerância mínima, em minutos, entre o fim de uma reserva e o
   * início da próxima — tempo para um grupo sair e o outro entrar.
   */
  BUFFER_MINUTOS: 10,
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
