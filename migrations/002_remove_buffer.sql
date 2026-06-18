-- SalaLivre — migration 002: remove o buffer de tolerância entre reservas
--
-- Regra anterior (001): cada reserva era "inchada" em +10 min no fim
-- (coluna gerada periodo_com_buffer) e a exclusion constraint impedia
-- sobreposição desse range inflado — forçando 10 min de folga entre
-- grupos.
--
-- Nova regra: NÃO há mais buffer. Duas reservas só conflitam se os
-- horários realmente se sobrepõem. O intervalo é [início, fim), então
-- reservas encostadas (uma termina 15:00, a próxima começa 15:00) são
-- permitidas. A garantia contra reserva em dobro continua no banco, via
-- EXCLUSION CONSTRAINT — apenas sem o buffer embutido.

-- Remove a coluna gerada antiga; CASCADE derruba junto a exclusion
-- constraint que dependia dela.
ALTER TABLE reservas DROP COLUMN IF EXISTS periodo_com_buffer CASCADE;

-- Intervalo efetivo da reserva, sem buffer. Coluna gerada (STORED) para
-- poder ser indexada pelo GiST da exclusion constraint abaixo.
ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS periodo tsrange GENERATED ALWAYS AS (
    tsrange(
      (data + hora_inicio)::timestamp,
      (data + hora_fim)::timestamp,
      '[)'
    )
  ) STORED;

-- Peça central do sistema: impede, a nível de banco, que duas reservas
-- tenham períodos sobrepostos — mesmo sob cadastros concorrentes.
-- Qualquer INSERT/UPDATE que viole isso falha com SQLSTATE 23P01.
ALTER TABLE reservas
  DROP CONSTRAINT IF EXISTS reservas_periodo_excl;
ALTER TABLE reservas
  ADD CONSTRAINT reservas_periodo_excl EXCLUDE USING gist (periodo WITH &&);
