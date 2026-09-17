# Modelo de dados

Uma única tabela: `reservas`. O banco é a **fonte da verdade** contra reserva
em dobro (a validação de front é só um complemento de UX).

## Tabela `reservas`

| Coluna | Tipo | Nulo | Padrão | Descrição |
| ------ | ---- | ---- | ------ | --------- |
| `id` | `uuid` | não | `gen_random_uuid()` | Chave primária. |
| `nome_responsavel` | `text` | não | — | Quem vai usar a sala (cadastrado pela equipe). |
| `setor` | `text` | não | — | Setor do responsável. |
| `matricula` | `text` | sim | `null` | Opcional (terceirizados podem não ter). |
| `data` | `date` | não | — | Dia da reserva. |
| `dia_inteiro` | `boolean` | não | `false` | Quando `true`, ocupa o expediente todo. |
| `hora_inicio` | `time` | não | — | Início. |
| `hora_fim` | `time` | não | — | Fim (> início). |
| `observacao` | `text` | sim | `null` | Observação livre. |
| `criado_em` | `timestamptz` | não | `now()` | Auditoria. |
| `periodo` | `tsrange` | gerada | — | `[data+hora_inicio, data+hora_fim)`, STORED. Indexada pelo GiST da exclusion constraint. |

> **Fuso horário:** as queries fazem cast explícito de `data`/`hora_*` para
> `text` (`data::text`, etc.), para o `postgres.js` devolver strings
> `"YYYY-MM-DD"` / `"HH:mm:ss"` em vez de `Date` — evitando qualquer
> ambiguidade de timezone entre banco, API e front. Ver `src/lib/reservas.ts`.

## Constraints (CHECK)

Definidas em `migrations/001_init.sql`:

- `nome_responsavel_nao_vazio` / `setor_nao_vazio`: `length(trim(...)) > 0`.
- `hora_fim_apos_inicio`: `hora_fim > hora_inicio`.
- `dentro_do_expediente`: `hora_inicio >= '08:00' AND hora_fim <= '17:00'`.
- `dia_inteiro_ocupa_expediente`: se `dia_inteiro`, então
  `hora_inicio = '08:00' AND hora_fim = '17:00'`.

> Os horários do expediente estão **hardcoded** no SQL. Se mudar
> `AGENDA_CONFIG.EXPEDIENTE_*` em `src/config/agenda.ts`, ajuste estes `CHECK`
> em uma nova migration.

## A exclusion constraint (peça central)

Impede, **no nível do banco**, que duas reservas tenham períodos sobrepostos —
mesmo sob cadastros concorrentes de celulares diferentes:

```sql
EXCLUDE USING gist (periodo WITH &&)
```

- Usa as extensões `btree_gist` e (por compatibilidade) `pgcrypto`.
- O `tsrange` é **meio-aberto** `[início, fim)`: reservas **encostadas** (uma
  termina 15:00, a próxima começa 15:00) **não** conflitam.
- Qualquer `INSERT`/`UPDATE` que viole a constraint falha com SQLSTATE
  **`23P01`** (`exclusion_violation`), detectado em `src/lib/db-erros.ts` e
  traduzido para HTTP **409** nas API routes.

### Sem buffer (migration 002)

A versão inicial (001) "inchava" o fim de cada reserva em +10 min (um buffer de
tolerância) via a coluna gerada `periodo_com_buffer`. A **migration
`002_remove_buffer.sql`** removeu isso:

- Removeu a coluna `periodo_com_buffer` (e, em cascata, a constraint antiga).
- Criou a coluna `periodo` (sem buffer) e a constraint `reservas_periodo_excl`.

Resultado: duas reservas só conflitam se **de fato** se sobrepõem. Não há mais
folga forçada entre elas.

## Índices

- Chave primária em `id`.
- `idx_reservas_data` em `(data)` — acelera as consultas por dia/mês.
- Índice GiST implícito da exclusion constraint sobre `periodo`.

## Migrations

SQL puro e versionado em `migrations/`, aplicado em ordem alfabética pelo script
`scripts/migrate.ts` (`npm run db:migrate`).

| Arquivo | O que faz |
| ------- | --------- |
| `001_init.sql` | Extensões, tabela `reservas`, todos os `CHECK` e a exclusion constraint (com buffer, na época). |
| `002_remove_buffer.sql` | Remove o buffer; recria a coluna de período e a exclusion constraint sem tolerância. |

As migrations são **idempotentes** (`IF NOT EXISTS` / `IF EXISTS`), então rodar
`db:migrate` novamente é seguro.
