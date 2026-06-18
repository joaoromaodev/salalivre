/**
 * Aplica, em ordem alfabética, todos os arquivos .sql da pasta
 * migrations/ contra o banco apontado por DATABASE_URL.
 *
 * Uso: npm run db:migrate
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não definida. Configure-a em .env.local (veja .env.example)."
    );
  }

  const sql = postgres(connectionString, { max: 1 });
  const dir = path.join(process.cwd(), "migrations");
  const arquivos = readdirSync(dir)
    .filter((nome) => nome.endsWith(".sql"))
    .sort();

  try {
    for (const arquivo of arquivos) {
      process.stdout.write(`Aplicando ${arquivo}... `);
      const conteudo = readFileSync(path.join(dir, arquivo), "utf-8");
      await sql.unsafe(conteudo);
      console.log("ok");
    }
    console.log(`${arquivos.length} migration(s) aplicada(s) com sucesso.`);
  } finally {
    await sql.end();
  }
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
