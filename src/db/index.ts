import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV === "production") {
  // Em produção na Vercel, se esquecer a variável, o erro deve ser claro
  console.warn("⚠️ DATABASE_URL não encontrada. O sistema pode falhar.");
}

// Fallback para evitar erro de quebra durante o Build da Vercel
const connectionString = databaseUrl || "postgresql://postgres:postgres@localhost:5432/app_db";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: connectionString,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
