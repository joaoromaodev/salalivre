import { z } from "zod";
import {
  AGENDA_CONFIG,
  EXPEDIENTE_FIM_MIN,
  EXPEDIENTE_INICIO_MIN,
  horaParaMinutos,
} from "@/config/agenda";

const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Schema de entrada de uma reserva, compartilhado entre o formulário
 * (client) e as API routes (server). Os nomes dos campos seguem 1:1 as
 * colunas da tabela `reservas` para não precisar de uma camada de
 * tradução entre front, API e banco.
 *
 * Valida o mesmo conjunto de regras de negócio que o banco garante via
 * CHECK/EXCLUDE constraints (expediente, dia inteiro, não-passado) —
 * isso é só para dar feedback rápido ao usuário. A garantia real contra
 * conflito de horário é a exclusion constraint em migrations/001_init.sql.
 */
export const reservaInputSchema = z
  .object({
    nome_responsavel: z
      .string()
      .trim()
      .min(1, "Informe o nome do responsável."),
    setor: z.string().trim().min(1, "Informe o setor."),
    matricula: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : undefined)),
    data: z.string().regex(DATA_REGEX, "Data inválida."),
    dia_inteiro: z.boolean(),
    hora_inicio: z.string().regex(HORA_REGEX, "Hora de início inválida."),
    hora_fim: z.string().regex(HORA_REGEX, "Hora de término inválida."),
    observacao: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : undefined)),
  })
  .transform((dados) =>
    dados.dia_inteiro
      ? {
          ...dados,
          hora_inicio: AGENDA_CONFIG.EXPEDIENTE_INICIO,
          hora_fim: AGENDA_CONFIG.EXPEDIENTE_FIM,
        }
      : dados
  )
  .superRefine((dados, ctx) => {
    const inicioMin = horaParaMinutos(dados.hora_inicio);
    const fimMin = horaParaMinutos(dados.hora_fim);

    if (fimMin <= inicioMin) {
      ctx.addIssue({
        code: "custom",
        path: ["hora_fim"],
        message: "O horário de término deve ser depois do início.",
      });
    }

    if (inicioMin < EXPEDIENTE_INICIO_MIN) {
      ctx.addIssue({
        code: "custom",
        path: ["hora_inicio"],
        message: `O início não pode ser antes das ${AGENDA_CONFIG.EXPEDIENTE_INICIO}.`,
      });
    }

    if (fimMin > EXPEDIENTE_FIM_MIN) {
      ctx.addIssue({
        code: "custom",
        path: ["hora_fim"],
        message: `O término não pode passar das ${AGENDA_CONFIG.EXPEDIENTE_FIM}.`,
      });
    }

    const inicioDataHora = new Date(`${dados.data}T${dados.hora_inicio}:00`);
    if (Number.isNaN(inicioDataHora.getTime())) {
      ctx.addIssue({
        code: "custom",
        path: ["data"],
        message: "Data ou hora inválida.",
      });
      return;
    }

    if (inicioDataHora.getTime() < Date.now()) {
      ctx.addIssue({
        code: "custom",
        path: ["data"],
        message: "Não é possível agendar em uma data/horário no passado.",
      });
    }
  });

export type ReservaInput = z.infer<typeof reservaInputSchema>;

/**
 * Mesmas regras de horário/expediente da criação, mas sem o bloqueio de
 * passado — usado ao editar uma reserva que já está em andamento ou
 * cujo dia já chegou, sem travar a edição de campos como observação.
 */
export const reservaUpdateSchema = z
  .object({
    nome_responsavel: z
      .string()
      .trim()
      .min(1, "Informe o nome do responsável."),
    setor: z.string().trim().min(1, "Informe o setor."),
    matricula: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : undefined)),
    data: z.string().regex(DATA_REGEX, "Data inválida."),
    dia_inteiro: z.boolean(),
    hora_inicio: z.string().regex(HORA_REGEX, "Hora de início inválida."),
    hora_fim: z.string().regex(HORA_REGEX, "Hora de término inválida."),
    observacao: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : undefined)),
  })
  .transform((dados) =>
    dados.dia_inteiro
      ? {
          ...dados,
          hora_inicio: AGENDA_CONFIG.EXPEDIENTE_INICIO,
          hora_fim: AGENDA_CONFIG.EXPEDIENTE_FIM,
        }
      : dados
  )
  .superRefine((dados, ctx) => {
    const inicioMin = horaParaMinutos(dados.hora_inicio);
    const fimMin = horaParaMinutos(dados.hora_fim);

    if (fimMin <= inicioMin) {
      ctx.addIssue({
        code: "custom",
        path: ["hora_fim"],
        message: "O horário de término deve ser depois do início.",
      });
    }
    if (inicioMin < EXPEDIENTE_INICIO_MIN) {
      ctx.addIssue({
        code: "custom",
        path: ["hora_inicio"],
        message: `O início não pode ser antes das ${AGENDA_CONFIG.EXPEDIENTE_INICIO}.`,
      });
    }
    if (fimMin > EXPEDIENTE_FIM_MIN) {
      ctx.addIssue({
        code: "custom",
        path: ["hora_fim"],
        message: `O término não pode passar das ${AGENDA_CONFIG.EXPEDIENTE_FIM}.`,
      });
    }
  });

export type ReservaUpdateInput = z.infer<typeof reservaUpdateSchema>;

export const loginSchema = z.object({
  senha: z.string().min(1, "Informe a senha."),
});
