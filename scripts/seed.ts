/**
 * Popula o banco com reservas 100% FICTÍCIAS para demonstração — nomes
 * inventados e setores genéricos ("Setor A", "Setor B"...), nenhum
 * dado real. Apaga as reservas existentes antes de inserir, então só
 * use isto em ambiente de desenvolvimento/demonstração.
 *
 * Uso: npm run db:seed
 */
import postgres from "postgres";

function formatarData(data: Date): string {
  return data.toISOString().slice(0, 10);
}

/** Data (sem hora) a `offsetDias` dias de hoje, no fuso local. */
function diasAPartirDeHoje(offsetDias: number): string {
  const data = new Date();
  data.setHours(0, 0, 0, 0);
  data.setDate(data.getDate() + offsetDias);
  return formatarData(data);
}

interface ReservaSeed {
  nome_responsavel: string;
  setor: string;
  matricula: string | null;
  data: string;
  dia_inteiro: boolean;
  hora_inicio: string;
  hora_fim: string;
  observacao: string | null;
}

// Datas relativas a "hoje" (script roda em qualquer dia e ainda faz
// sentido: histórico no passado, algumas hoje, outras no futuro).
const RESERVAS_FICTICIAS: ReservaSeed[] = [
  {
    nome_responsavel: "Ana Beatriz Lima",
    setor: "Setor A",
    matricula: "10234",
    data: diasAPartirDeHoje(-3),
    dia_inteiro: false,
    hora_inicio: "09:00",
    hora_fim: "10:00",
    observacao: null,
  },
  {
    nome_responsavel: "Carlos Eduardo Souza",
    setor: "Setor B",
    matricula: "10567",
    data: diasAPartirDeHoje(-3),
    dia_inteiro: false,
    hora_inicio: "14:00",
    hora_fim: "15:30",
    observacao: "Reunião com fornecedor",
  },
  {
    nome_responsavel: "Fernanda Oliveira",
    setor: "Setor C",
    matricula: null,
    data: diasAPartirDeHoje(-1),
    dia_inteiro: true,
    hora_inicio: "08:00",
    hora_fim: "17:00",
    observacao: "Treinamento interno",
  },
  {
    nome_responsavel: "Juliana Pereira",
    setor: "Setor A",
    matricula: "10891",
    data: diasAPartirDeHoje(0),
    dia_inteiro: false,
    hora_inicio: "08:00",
    hora_fim: "09:00",
    observacao: null,
  },
  {
    nome_responsavel: "Marcos Vinícius Costa",
    setor: "Setor D",
    matricula: null,
    data: diasAPartirDeHoje(0),
    dia_inteiro: false,
    hora_inicio: "10:00",
    hora_fim: "11:00",
    observacao: null,
  },
  {
    nome_responsavel: "Patrícia Gomes",
    setor: "Setor B",
    matricula: "11023",
    data: diasAPartirDeHoje(0),
    dia_inteiro: false,
    hora_inicio: "15:00",
    hora_fim: "16:00",
    observacao: "Entrevista",
  },
  {
    nome_responsavel: "Rafael Santos",
    setor: "Setor C",
    matricula: "11187",
    data: diasAPartirDeHoje(1),
    dia_inteiro: false,
    hora_inicio: "09:00",
    hora_fim: "10:30",
    observacao: null,
  },
  {
    nome_responsavel: "Beatriz Fernandes",
    setor: "Setor A",
    matricula: null,
    data: diasAPartirDeHoje(1),
    dia_inteiro: false,
    hora_inicio: "13:00",
    hora_fim: "14:00",
    observacao: null,
  },
  {
    nome_responsavel: "Equipe de Treinamento",
    setor: "Setor E",
    matricula: null,
    data: diasAPartirDeHoje(2),
    dia_inteiro: true,
    hora_inicio: "08:00",
    hora_fim: "17:00",
    observacao: "Capacitação trimestral",
  },
  {
    nome_responsavel: "Lucas Martins",
    setor: "Setor B",
    matricula: "11456",
    data: diasAPartirDeHoje(3),
    dia_inteiro: false,
    hora_inicio: "09:00",
    hora_fim: "09:30",
    observacao: null,
  },
  {
    nome_responsavel: "Camila Rodrigues",
    setor: "Setor D",
    matricula: null,
    data: diasAPartirDeHoje(3),
    dia_inteiro: false,
    hora_inicio: "11:00",
    hora_fim: "12:00",
    observacao: null,
  },
  {
    nome_responsavel: "Diego Almeida",
    setor: "Setor C",
    matricula: "11789",
    data: diasAPartirDeHoje(5),
    dia_inteiro: false,
    hora_inicio: "14:00",
    hora_fim: "15:00",
    observacao: "Alinhamento mensal",
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não definida. Configure-a em .env.local (veja .env.example)."
    );
  }

  const sql = postgres(connectionString, { max: 1 });

  try {
    await sql`delete from reservas`;

    for (const reserva of RESERVAS_FICTICIAS) {
      await sql`
        insert into reservas (
          nome_responsavel, setor, matricula,
          data, dia_inteiro, hora_inicio, hora_fim, observacao
        ) values (
          ${reserva.nome_responsavel}, ${reserva.setor}, ${reserva.matricula},
          ${reserva.data}::date, ${reserva.dia_inteiro}, ${reserva.hora_inicio}, ${reserva.hora_fim},
          ${reserva.observacao}
        )
      `;
    }

    console.log(
      `${RESERVAS_FICTICIAS.length} reserva(s) fictícia(s) inserida(s) com sucesso.`
    );
  } finally {
    await sql.end();
  }
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
