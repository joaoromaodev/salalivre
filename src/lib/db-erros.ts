/** SQLSTATE da exclusion constraint que impede reservas com conflito de horário. */
const EXCLUSION_VIOLATION = "23P01";

/**
 * Verdadeiro quando o erro veio da EXCLUDE USING gist da tabela
 * `reservas` (migrations/001_init.sql) — ou seja, o horário pedido
 * conflita (considerando o buffer) com outra reserva já existente.
 */
export function isExclusionViolation(erro: unknown): boolean {
  return (
    typeof erro === "object" &&
    erro !== null &&
    "code" in erro &&
    (erro as { code?: unknown }).code === EXCLUSION_VIOLATION
  );
}
