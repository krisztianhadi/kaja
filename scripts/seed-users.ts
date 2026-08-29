/**
 * Seed users from the config (USERS_JSON env or users.config.json).
 * Idempotent: existing users are never modified.
 *
 * Run with: pnpm db:seed
 */
import "dotenv/config";
import { ensureUsers, loadConfigUsers } from "../lib/auth/seed-users";
import { sql } from "../lib/db";

async function main() {
  const config = loadConfigUsers();
  await ensureUsers();
  console.log(`Seeded ${config.length} configured user(s)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    // close the connection pool so the process can exit
    await sql.end({ timeout: 5 });
  });
