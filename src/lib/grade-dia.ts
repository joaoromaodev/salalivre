import {
  EXPEDIENTE_FIM_MIN,
  EXPEDIENTE_INICIO_MIN,
  horaParaMinutos,
  minutosParaHora,
} from "@/config/agenda";

export type StatusDia = "livre" | "parcial" | "cheio";

/**
 * Subconjunto mínimo de uma reserva necessário para montar a grade do
 * dia e o status. Permite reaproveitar estas funções tanto com a
 * `Reserva` completa (agenda interna) quanto com a versão enxuta, sem
 * dados pessoais, usada na visão pública da porta.
 */
export interface IntervaloDia {
  /** "HH:mm" ou "HH:mm:ss" */
  hora_inicio: string;
  /** "HH:mm" ou "HH:mm:ss" */
  hora_fim: string;
}

/**
 * "Cheio" quando o tempo ocupado já cobre o expediente inteiro — seja
 * por uma reserva de dia inteiro, seja por reservas que juntas somam
 * todo o expediente.
 */
export function calcularStatusDoDia(reservas: IntervaloDia[]): StatusDia {
  if (reservas.length === 0) return "livre";

  const totalMin = EXPEDIENTE_FIM_MIN - EXPEDIENTE_INICIO_MIN;
  const ocupadoMin = reservas.reduce(
    (soma, reserva) =>
      soma +
      (horaParaMinutos(reserva.hora_fim.slice(0, 5)) -
        horaParaMinutos(reserva.hora_inicio.slice(0, 5))),
    0
  );

  return ocupadoMin >= totalMin ? "cheio" : "parcial";
}

export interface ItemGradeLivre {
  tipo: "livre";
  inicio: string;
  fim: string;
}

export interface ItemGradeOcupado<T extends IntervaloDia = IntervaloDia> {
  tipo: "ocupado";
  inicio: string;
  fim: string;
  reserva: T;
}

export type ItemGrade<T extends IntervaloDia = IntervaloDia> =
  | ItemGradeLivre
  | ItemGradeOcupado<T>;

/** Monta a grade do expediente do dia: blocos vagos e ocupados, em ordem. */
export function construirGradeDoDia<T extends IntervaloDia>(
  reservas: T[]
): ItemGrade<T>[] {
  const ordenadas = [...reservas].sort((a, b) =>
    a.hora_inicio.localeCompare(b.hora_inicio)
  );

  const itens: ItemGrade<T>[] = [];
  let cursor = EXPEDIENTE_INICIO_MIN;

  for (const reserva of ordenadas) {
    const inicio = horaParaMinutos(reserva.hora_inicio.slice(0, 5));
    const fim = horaParaMinutos(reserva.hora_fim.slice(0, 5));

    if (inicio > cursor) {
      itens.push({
        tipo: "livre",
        inicio: minutosParaHora(cursor),
        fim: minutosParaHora(inicio),
      });
    }

    itens.push({
      tipo: "ocupado",
      inicio: minutosParaHora(inicio),
      fim: minutosParaHora(fim),
      reserva,
    });
    cursor = Math.max(cursor, fim);
  }

  if (cursor < EXPEDIENTE_FIM_MIN) {
    itens.push({
      tipo: "livre",
      inicio: minutosParaHora(cursor),
      fim: minutosParaHora(EXPEDIENTE_FIM_MIN),
    });
  }

  return itens;
}
