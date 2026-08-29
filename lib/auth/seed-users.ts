import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "./password";

export interface ConfigUser {
  username: string;
  password: string;
}

/**
 * Users come from a simple config (no registration, no email verification):
 * 1. USERS_JSON env var - preferred for deployments, e.g.
 *    [{"username":"dad","password":"..."}]
 * 2. users.config.json in the repo root (gitignored) - local dev
 */
export function loadConfigUsers(): ConfigUser[] {
  const envJson = process.env.USERS_JSON;
  if (envJson) {
    const parsed = JSON.parse(envJson) as ConfigUser[] | { users: ConfigUser[] };
    return Array.isArray(parsed) ? parsed : parsed.users ?? [];
  }
  const p = path.join(process.cwd(), "users.config.json");
  if (fs.existsSync(p)) {
    const parsed = JSON.parse(fs.readFileSync(p, "utf8")) as
      | ConfigUser[]
      | { users: ConfigUser[] };
    return Array.isArray(parsed) ? parsed : parsed.users ?? [];
  }
  return [];
}

/**
 * Upsert every configured user. Existing users are never modified (password,
 * bio, targets stay as edited in Settings). Idempotent - safe to call often.
 */
export async function ensureUsers(): Promise<void> {
  const config = loadConfigUsers();
  for (const u of config) {
    if (!u.username || !u.password) continue;
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, u.username))
      .limit(1);
    if (existing.length === 0) {
      const passwordHash = await hashPassword(u.password);
      await db.insert(users).values({ username: u.username, passwordHash });
    }
  }
}
