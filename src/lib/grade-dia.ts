import {
  EXPEDIENTE_FIM_MIN,
  EXPEDIENTE_INICIO_MIN,
  horaParaMinutos,
  minutosParaHora,
} from "@/config/agenda";
import type { Reserva } from "@/lib/reservas";

export type StatusDia = "livre" | "parcial" | "cheio";

/**
 * "Cheio" quando o tempo ocupado (sem contar o buffer, que é só
 * tolerância entre reservas) já cobre o expediente inteiro — na
 * prática, isso só acontece com uma reserva de dia inteiro, já que o
 * buffer obrigatório entre reservas distintas sempre deixa alguma
 * folga entre elas.
 */
export function calcularStatusDoDia(reservas: Reserva[]): StatusDia {
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

export interface ItemGradeOcupado {
  tipo: "ocupado";
  inicio: string;
  fim: string;
  reserva: Reserva;
}

export type ItemGrade = ItemGradeLivre | ItemGradeOcupado;

/** Monta a grade do expediente do dia: blocos vagos e ocupados, em ordem. */
export function construirGradeDoDia(reservas: Reserva[]): ItemGrade[] {
  const ordenadas = [...reservas].sort((a, b) =>
    a.hora_inicio.localeCompare(b.hora_inicio)
  );

  const itens: ItemGrade[] = [];
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
