import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";
import { getSessionUserId } from "@/lib/auth/session";

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

/** Public user shape sent to the client. */
export function userDto(user: User) {
  return {
    id: user.id,
    username: user.username,
    bio: user.bio,
    goals: user.goals,
    diet: user.diet,
    targetKcal: user.targetKcal,
    targetProteinG: user.targetProteinG,
    targetFatG: user.targetFatG,
    targetCarbsG: user.targetCarbsG,
    targetSugarG: user.targetSugarG,
    targetSodiumMg: user.targetSodiumMg,
    hasOwnApiKey: !!user.geminiApiKey,
  };
}

/**
 * Require a logged-in user for a route handler.
 * Throws a NextResponse-compatible error object on failure.
 */
export async function requireUser(): Promise<User> {
  const userId = await getSessionUserId();
  if (!userId) {
    throw jsonError(401, "Not signed in");
  }
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    throw jsonError(401, "Not signed in");
  }
  return user;
}

/** Dietary context lines fed to the AI. */
export function userContextText(
  user: Pick<User, "bio" | "goals" | "diet">
): string {
  const lines: string[] = [];
  if (user.bio) lines.push(`- Dietary notes: ${user.bio}`);
  if (user.goals) lines.push(`- Goals: ${user.goals}`);
  if (user.diet) lines.push(`- Ongoing diet: ${user.diet}`);
  return lines.length > 0 ? lines.join("\n") : "- none provided";
}

/** API key used for Gemini: the user's own override, else the server env key. */
export function geminiApiKey(user: User): string | null {
  return user.geminiApiKey || process.env.GEMINI_TOKEN || null;
}
