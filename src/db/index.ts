import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Credenciais embutidas para facilitar o deploy
const SUPABASE_URL = "postgresql://postgres:JoCa1506Si%23@db.bueynmtetdriftuyivqr.supabase.co:5432/postgres";
const databaseUrl = process.env.DATABASE_URL || SUPABASE_URL;

const connectionString = databaseUrl;

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
