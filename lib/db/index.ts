import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Lazy connection: the client is created on first use, not at module
 * load. next build's "Collecting page data" imports every route module,
 * so a module-level throw would fail the build when DATABASE_URL is only
 * available at runtime (Railway injects it at runtime, not build time).
 */
let client: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getClient() {
  if (!client) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    // prepare:false - required for use with Next.js (postgres.js prepared
    // statements do not survive hot reloads / pooled connections)
    client = postgres(connectionString, { max: 10, prepare: false });
  }
  return client;
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getClient(), { schema });
  }
  return dbInstance;
}

// the raw postgres client, created lazily like db - used by seed scripts
// to close the pool (sql.end())
export function getSql() {
  return getClient();
}

// convenience accessor so existing `db` imports keep working
export const db = new Proxy(
  {},
  {
    get: (_target, prop: string | symbol) => {
      const d = getDb();
      const value = (d as unknown as Record<string | symbol, unknown>)[prop];
      return typeof value === "function" ? value.bind(d) : value;
    },
  }
) as ReturnType<typeof drizzle<typeof schema>>;

// lazy proxy for the raw client, same idea as db
export const sql = new Proxy(
  {},
  {
    get: (_target, prop: string | symbol) => {
      const c = getSql();
      const value = (c as unknown as Record<string | symbol, unknown>)[prop];
      return typeof value === "function" ? value.bind(c) : value;
    },
  }
) as ReturnType<typeof postgres>;

export { schema };
