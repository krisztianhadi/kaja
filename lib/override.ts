import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dayOverrides, type User } from "@/lib/db/schema";
import {
  computeBudget,
  type ActivityLevel,
  type Budget,
  type Gender,
  type Goal,
  type OverrideMode,
} from "./budget";

/** Per-day activity override for the user's day key (client-local date). */
export async function getOverrideMode(
  userId: string,
  dayKey: string
): Promise<OverrideMode | null> {
  const [row] = await db
    .select({ mode: dayOverrides.mode })
    .from(dayOverrides)
    .where(
      and(eq(dayOverrides.userId, userId), eq(dayOverrides.dayKey, dayKey))
    )
    .limit(1);
  if (!row) return null;
  return (row.mode as OverrideMode) ?? null;
}

export async function setOverride(
  userId: string,
  dayKey: string,
  mode: OverrideMode
): Promise<void> {
  await db
    .insert(dayOverrides)
    .values({ userId, dayKey, mode })
    .onConflictDoUpdate({
      target: [dayOverrides.userId, dayOverrides.dayKey],
      set: { mode, updatedAt: new Date() },
    });
}

/** The effective calorie budget for a user on a given day. */
export async function budgetForDay(
  user: User,
  dayKey: string
): Promise<Budget> {
  const overrideMode = (await getOverrideMode(user.id, dayKey)) ?? "usual";
  return computeBudget({
    weightKg: user.weightKg,
    heightCm: user.heightCm,
    age: user.age,
    gender: (user.gender as Gender | null) ?? null,
    activity: (user.activity as ActivityLevel) ?? "sedentary",
    goal: (user.goal as Goal) ?? "maintain",
    manualKcal: user.manualKcal,
    overrideMode,
  });
}
