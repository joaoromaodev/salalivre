-- SalaLivre — migration inicial
--
-- Cria a tabela `reservas` para uma sala de reunião ÚNICA e de uso
-- exclusivo (nunca dividida entre dois grupos). A garantia contra
-- reserva em dobro é feita no próprio banco, via EXCLUSION CONSTRAINT
-- sobre um intervalo de tempo (tsrange) que já embute o buffer de
-- tolerância entre reservas — não depende de validação no front-end.

-- gen_random_uuid() é nativo a partir do PostgreSQL 13; pgcrypto é
-- ativada aqui apenas por compatibilidade com versões/provedores mais
-- antigos do Postgres.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Não é estritamente necessária hoje (a sala é única, então a exclusion
-- constraint usa só a coluna de range), mas é habilitada para permitir,
-- no futuro, combinar um identificador de sala/recurso com WITH = no
-- mesmo EXCLUDE USING gist sem precisar de outra migration.
CREATE EXTENSION IF NOT EXISTS "btree_gist";

CREATE TABLE IF NOT EXISTS reservas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  nome_responsavel text NOT NULL,
  setor text NOT NULL,
  matricula text,

  data date NOT NULL,
  dia_inteiro boolean NOT NULL DEFAULT false,
  hora_inicio time NOT NULL,
  hora_fim time NOT NULL,

  observacao text,

  criado_em timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT nome_responsavel_nao_vazio CHECK (length(trim(nome_responsavel)) > 0),
  CONSTRAINT setor_nao_vazio CHECK (length(trim(setor)) > 0),

  CONSTRAINT hora_fim_apos_inicio CHECK (hora_fim > hora_inicio),

  -- Expediente: 08:00–17:00. Mantenha em sincronia manual com
  -- AGENDA_CONFIG em src/config/agenda.ts caso este intervalo mude.
  CONSTRAINT dentro_do_expediente CHECK (
    hora_inicio >= TIME '08:00' AND hora_fim <= TIME '17:00'
  ),

  -- "Dia inteiro" é só uma reserva que ocupa o expediente todo: força
  -- hora_inicio/hora_fim a baterem com o expediente quando marcado.
  CONSTRAINT dia_inteiro_ocupa_expediente CHECK (
    NOT dia_inteiro OR (hora_inicio = TIME '08:00' AND hora_fim = TIME '17:00')
  ),

  -- Intervalo efetivo da reserva, já "inchado" pelo buffer de 10 min no
  -- fim (ex.: 14:00–15:00 bloqueia, na prática, até 15:10). É uma coluna
  -- gerada (STORED) para poder ser indexada pelo GiST abaixo. O buffer
  -- está hardcoded em '10 minutes' porque colunas geradas não podem
  -- referenciar configuração da aplicação — mantenha em sincronia manual
  -- com AGENDA_CONFIG.BUFFER_MINUTOS em src/config/agenda.ts.
  periodo_com_buffer tsrange GENERATED ALWAYS AS (
    tsrange(
      (data + hora_inicio)::timestamp,
      (data + hora_fim)::timestamp + interval '10 minutes',
      '[)'
    )
  ) STORED,

  -- Peça central do sistema: impede, a nível de banco, que duas
  -- reservas tenham períodos (com buffer) sobrepostos — mesmo sob
  -- cadastros concorrentes. Qualquer INSERT/UPDATE que viole isso falha
  -- com SQLSTATE 23P01 (exclusion_violation).
  EXCLUDE USING gist (periodo_com_buffer WITH &&)
);

CREATE INDEX IF NOT EXISTS idx_reservas_data ON reservas (data);
