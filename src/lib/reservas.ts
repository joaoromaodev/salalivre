import { sql } from "@/db/client";
import type { ReservaInput, ReservaUpdateInput } from "@/lib/validacao";

export interface Reserva {
  id: string;
  nome_responsavel: string;
  setor: string;
  matricula: string | null;
  /** "YYYY-MM-DD" */
  data: string;
  dia_inteiro: boolean;
  /** "HH:mm:ss" */
  hora_inicio: string;
  /** "HH:mm:ss" */
  hora_fim: string;
  observacao: string | null;
  criado_em: string;
}

// Casts explícitos para texto em `data`/`hora_*` evitam que o
// postgres.js devolva esses valores como Date (que carregaria fuso
// horário) — assim o formato trafega como string "YYYY-MM-DD" /
// "HH:mm:ss" de ponta a ponta, sem ambiguidade de timezone.
const RESERVA_COLUNAS = sql`
  id, nome_responsavel, setor, matricula,
  data::text as data, dia_inteiro,
  hora_inicio::text as hora_inicio, hora_fim::text as hora_fim,
  observacao, criado_em
`;

export async function listarReservasPorData(data: string): Promise<Reserva[]> {
  return sql<Reserva[]>`
    select ${RESERVA_COLUNAS}
    from reservas
    where data = ${data}::date
    order by hora_inicio
  `;
}

/** Todas as reservas dentro do mês de `ano`/`mes` (mes: 1-12). */
export async function listarReservasDoMes(
  ano: number,
  mes: number
): Promise<Reserva[]> {
  const inicioDoMes = `${ano}-${String(mes).padStart(2, "0")}-01`;
  return sql<Reserva[]>`
    select ${RESERVA_COLUNAS}
    from reservas
    where data >= ${inicioDoMes}::date
      and data < (${inicioDoMes}::date + interval '1 month')
    order by data, hora_inicio
  `;
}

/**
 * Versão enxuta da ocupação de um dia/mês, SEM dados pessoais — usada
 * na visão pública (QR code da porta). Expõe só os horários ocupados,
 * nunca quem reservou.
 */
export interface OcupacaoPublica {
  /** "YYYY-MM-DD" */
  data: string;
  dia_inteiro: boolean;
  /** "HH:mm:ss" */
  hora_inicio: string;
  /** "HH:mm:ss" */
  hora_fim: string;
}

/** Ocupação (sem dados pessoais) do mês de `ano`/`mes` (mes: 1-12). */
export async function listarOcupacaoDoMes(
  ano: number,
  mes: number
): Promise<OcupacaoPublica[]> {
  const inicioDoMes = `${ano}-${String(mes).padStart(2, "0")}-01`;
  return sql<OcupacaoPublica[]>`
    select
      data::text as data, dia_inteiro,
      hora_inicio::text as hora_inicio, hora_fim::text as hora_fim
    from reservas
    where data >= ${inicioDoMes}::date
      and data < (${inicioDoMes}::date + interval '1 month')
    order by data, hora_inicio
  `;
}

export interface ListarProximasOpcoes {
  busca?: string;
  limite?: number;
  /** "YYYY-MM-DD" — padrão: hoje. */
  apartirDe?: string;
}

export async function listarProximasReservas(
  opcoes: ListarProximasOpcoes = {}
): Promise<Reserva[]> {
  const { busca, limite = 50 } = opcoes;
  const dataMin = opcoes.apartirDe ?? new Date().toISOString().slice(0, 10);
  const termo = busca?.trim();

  return sql<Reserva[]>`
    select ${RESERVA_COLUNAS}
    from reservas
    where data >= ${dataMin}::date
      ${
        termo
          ? sql`and (nome_responsavel ilike ${"%" + termo + "%"} or setor ilike ${"%" + termo + "%"})`
          : sql``
      }
    order by data, hora_inicio
    limit ${limite}
  `;
}

export async function buscarReservaPorId(id: string): Promise<Reserva | null> {
  const linhas = await sql<Reserva[]>`
    select ${RESERVA_COLUNAS} from reservas where id = ${id}
  `;
  return linhas[0] ?? null;
}

export async function criarReserva(input: ReservaInput): Promise<Reserva> {
  const [linha] = await sql<Reserva[]>`
    insert into reservas (
      nome_responsavel, setor, matricula,
      data, dia_inteiro, hora_inicio, hora_fim, observacao
    ) values (
      ${input.nome_responsavel}, ${input.setor}, ${input.matricula ?? null},
      ${input.data}::date, ${input.dia_inteiro}, ${input.hora_inicio}, ${input.hora_fim},
      ${input.observacao ?? null}
    )
    returning ${RESERVA_COLUNAS}
  `;
  return linha;
}

export async function atualizarReserva(
  id: string,
  input: ReservaUpdateInput
): Promise<Reserva | null> {
  const linhas = await sql<Reserva[]>`
    update reservas set
      nome_responsavel = ${input.nome_responsavel},
      setor = ${input.setor},
      matricula = ${input.matricula ?? null},
      data = ${input.data}::date,
      dia_inteiro = ${input.dia_inteiro},
      hora_inicio = ${input.hora_inicio},
      hora_fim = ${input.hora_fim},
      observacao = ${input.observacao ?? null}
    where id = ${id}
    returning ${RESERVA_COLUNAS}
  `;
  return linhas[0] ?? null;
}

export async function cancelarReserva(id: string): Promise<boolean> {
  const linhas = await sql`delete from reservas where id = ${id} returning id`;
  return linhas.length > 0;
}
