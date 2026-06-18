import postgres from "postgres";

/**
 * Cliente Postgres único, reutilizado entre hot-reloads em dev para não
 * esgotar o pool de conexões (Neon free tier é sensível a isso).
 *
 * Usa postgres.js puro (não supabase-js) conectando via DATABASE_URL,
 * então funciona com qualquer provedor Postgres — basta trocar a
 * connection string. SSL e demais parâmetros (ex.: sslmode=require do
 * Neon) já vêm embutidos na própria URL e são respeitados
 * automaticamente pela lib.
 */

declare global {
  var __salalivreSql: ReturnType<typeof postgres> | undefined;
}

function criarCliente() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não definida. Configure-a em .env.local (veja .env.example)."
    );
  }

  return postgres(connectionString, {
    max: 5,
  });
}

export const sql = globalThis.__salalivreSql ?? criarCliente();

if (process.env.NODE_ENV !== "production") {
  globalThis.__salalivreSql = sql;
}
