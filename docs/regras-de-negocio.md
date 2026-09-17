# Regras de negócio

Configuração central em [`src/config/agenda.ts`](../src/config/agenda.ts).

| Parâmetro | Valor |
| --------- | ----- |
| Expediente | 08:00 – 17:00 |

Todas as regras abaixo são validadas **no formulário** (feedback rápido) **e**
garantidas **no banco** via `CHECK`/`EXCLUDE`. A validação de front nunca é a
única linha de defesa.

## 1. A sala é exclusiva (sem sobreposição)

Nunca pode haver duas reservas com horários sobrepostos no mesmo dia. Garantido
pela exclusion constraint (`EXCLUDE USING gist (periodo WITH &&)`). Ver
[Modelo de dados](./modelo-de-dados.md).

## 2. Sem buffer entre reservas

Não há tolerância entre reservas. Duas reservas só conflitam se **de fato** se
sobrepõem. Como o período é `[início, fim)` (meio-aberto), reservas
**encostadas** são permitidas:

- `14:00–15:00` e `15:00–16:00` → **permitidas** (encostadas).
- `14:00–15:00` e `14:30–15:30` → **bloqueadas** (sobrepostas).

Espelhado no front por `src/lib/conflito.ts` (`intervalosConflitam`).

## 3. Horário livre dentro do expediente

O horário é livre: **qualquer minuto** entre 08:00 e 17:00 (ex.: `15:02`,
`16:20`), não só múltiplos de 30 minutos. No formulário isso é um campo
`<input type="time">` com `min`/`max` no expediente.

Regras de horário (validadas em `src/lib/validacao.ts` e nos `CHECK` do banco):

- `hora_fim > hora_inicio`.
- `hora_inicio >= 08:00`.
- `hora_fim <= 17:00`.

## 4. "Dia inteiro"

É apenas uma reserva que ocupa o expediente todo. Quando `dia_inteiro = true`,
o sistema força `hora_inicio = 08:00` e `hora_fim = 17:00` (no schema zod e no
`CHECK dia_inteiro_ocupa_expediente`).

## 5. Agendar na hora (sem antecedência)

Pode-se agendar para **hoje a qualquer momento**, inclusive na hora — não é
preciso um dia de antecedência. Apenas **datas anteriores a hoje** são
bloqueadas na criação (o histórico continua visível e consultável).

- Implementado em `reservaInputSchema` (`src/lib/validacao.ts`): bloqueia só se
  o **dia** da reserva for anterior a hoje (00:00 de hoje).
- O `reservaUpdateSchema` (edição) **não** tem esse bloqueio, para permitir
  editar reservas de hoje ou já em andamento.

## Dupla validação (front + banco)

| Onde | Como | Papel |
| ---- | ---- | ----- |
| Formulário (client) | zod (`reservaInputSchema`) + `use-disponibilidade` consultando `GET /api/disponibilidade` | Feedback imediato, antes de enviar. |
| API route (server) | zod (mesmo schema) | Rejeita dados inválidos (400). |
| Banco | `CHECK` + `EXCLUDE` | Fonte da verdade. Conflito → `23P01` → HTTP 409. |

> A checagem de disponibilidade em tempo real (`/api/disponibilidade`) é
> **cosmética**: informa "livre" ou "em conflito" enquanto o usuário preenche.
> A garantia real contra reserva em dobro é sempre a exclusion constraint —
> importante sob cadastros concorrentes, onde dois usuários poderiam ver
> "livre" ao mesmo tempo, mas só um `INSERT` vence.

## Onde alterar cada regra

| Para mudar… | Edite… | E lembre de… |
| ----------- | ------ | ------------ |
| Horário do expediente | `AGENDA_CONFIG.EXPEDIENTE_*` | criar uma migration ajustando os `CHECK` `dentro_do_expediente` e `dia_inteiro_ocupa_expediente`. |
| Reintroduzir um buffer | `src/lib/conflito.ts` (front) | criar uma migration mudando a coluna `periodo`/exclusion constraint (ver como era em `001_init.sql`). |
| Permitir agendar no passado | `reservaInputSchema` (`validacao.ts`) | eventual ajuste na UI (o calendário do form desabilita dias anteriores a hoje). |
