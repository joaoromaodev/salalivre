import { NextResponse } from "next/server";
import { encontrarConflitos } from "@/lib/conflito";
import { listarReservasPorData } from "@/lib/reservas";

const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Checagem de conflito em tempo real para feedback no formulário,
 * ANTES de submeter. Não é a fonte da verdade contra conflito de
 * horário — essa garantia é da exclusion constraint do banco
 * (migrations/001 + 002); esta rota só consulta as reservas do dia e
 * replica a mesma regra de sobreposição em JS (src/lib/conflito.ts).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get("data");
  const horaInicio = searchParams.get("hora_inicio");
  const horaFim = searchParams.get("hora_fim");
  const excluirId = searchParams.get("excluir_id") ?? undefined;

  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return NextResponse.json({ error: "Parâmetro 'data' inválido." }, { status: 400 });
  }
  if (!horaInicio || !HORA_REGEX.test(horaInicio)) {
    return NextResponse.json({ error: "Parâmetro 'hora_inicio' inválido." }, { status: 400 });
  }
  if (!horaFim || !HORA_REGEX.test(horaFim)) {
    return NextResponse.json({ error: "Parâmetro 'hora_fim' inválido." }, { status: 400 });
  }

  const reservasDoDia = await listarReservasPorData(data);
  const conflitos = encontrarConflitos(
    { hora_inicio: horaInicio, hora_fim: horaFim },
    reservasDoDia,
    excluirId
  );

  return NextResponse.json({
    livre: conflitos.length === 0,
    conflitos: conflitos.map((reserva) => ({
      id: reserva.id,
      nome_responsavel: reserva.nome_responsavel,
      setor: reserva.setor,
      hora_inicio: reserva.hora_inicio,
      hora_fim: reserva.hora_fim,
    })),
  });
}
