import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";
import { getSessionUserId } from "@/lib/auth/session";
import { profileContextText, type Gender, type ActivityLevel, type Goal } from "./budget";

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
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    age: user.age,
    gender: user.gender as Gender | null,
    activity: (user.activity ?? "sedentary") as ActivityLevel,
    goal: (user.goal ?? "maintain") as Goal,
    manualKcal: user.manualKcal,
    region: user.region,
    climate: user.climate as "hot" | "temperate",
    scientific: user.scientific,
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
  user: Pick<
    User,
    | "bio"
    | "goals"
    | "diet"
    | "heightCm"
    | "weightKg"
    | "age"
    | "gender"
    | "activity"
    | "goal"
    | "manualKcal"
    | "region"
    | "climate"
  >,
  budgetKcal: number | null
): string {
  const lines: string[] = [];
  if (user.bio) lines.push(`- Dietary notes: ${user.bio}`);
  if (user.goals) lines.push(`- Goals: ${user.goals}`);
  if (user.diet) lines.push(`- Ongoing diet: ${user.diet}`);
  if (user.region) lines.push(`- Location: ${user.region}`);
  if (user.climate === "hot") {
    lines.push(
      "- Climate: hot and humid - the user sweats a lot, so sodium and mineral needs are higher than usual; keep suggestions practical (hydration, electrolytes)."
    );
  }
  const profile = profileContextText({
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    age: user.age,
    gender: (user.gender as Gender | null) ?? null,
    activity: (user.activity as ActivityLevel | null) ?? "sedentary",
    goal: (user.goal as Goal | null) ?? "maintain",
    budgetKcal,
    region: user.region,
  });
  if (profile) lines.push(`- Profile: ${profile}`);
  return lines.length > 0 ? lines.join("\n") : "- none provided";
}

/** API key used for Gemini: the user's own override, else the server env key. */
export function geminiApiKey(user: User): string | null {
  return user.geminiApiKey || process.env.GEMINI_TOKEN || null;
}
