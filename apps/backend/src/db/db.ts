import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const rawDatabaseUrl = process.env.DATABASE_URL?.trim();
const databaseUrl = rawDatabaseUrl?.replace(/^"(.*)"$/, "$1");

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const useNeonSsl = databaseUrl.includes(".neon.tech");
const envMode = process.env.DB_SSL_MODE?.toLowerCase();
const effectiveSslMode = envMode || (useNeonSsl || process.env.NODE_ENV === "production" ? "require" : "disable");

if (effectiveSslMode === "insecure" && process.env.NODE_ENV === "production") {
  throw new Error("DB_SSL_MODE=insecure is not allowed in production");
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl:
    effectiveSslMode === "disable"
      ? undefined
      : { rejectUnauthorized: effectiveSslMode !== "insecure" },
});

export const db = drizzle(pool);
