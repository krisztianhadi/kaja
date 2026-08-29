import { desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { meals, type Meal, type NewMeal } from "@/lib/db/schema";
import { mealToDto, dayKeyFor } from "@/lib/stats";
import { mealScaleForUser, totalsForMeals, type Totals } from "./nutrition";
import type { MealDto } from "./types";

const MS_DAY = 86_400_000;

/** Meals this user can see (authored or shared with them), newest first. */
export async function fetchVisibleMeals(
  userId: string,
  sinceMs: number,
  limit = 200
): Promise<Meal[]> {
  const rows = await db
    .select()
    .from(meals)
    // ISO string, not Date: postgres.js non-prepared mode rejects Date params
    .where(sql`${meals.createdAt} > ${new Date(sinceMs).toISOString()}`)
    .orderBy(desc(meals.createdAt))
    .limit(limit);
  return rows.filter((m) => mealScaleForUser(m, userId) > 0);
}

export interface RecordResult {
  meal: MealDto;
  todayTotals: Totals;
}

/**
 * Insert a meal and return it plus the user's fresh day totals
 * (client-local day, shared meals split equally).
 */
export async function recordMeal(
  values: NewMeal,
  userId: string,
  tzOffsetMin: number
): Promise<RecordResult> {
  const [meal] = await db.insert(meals).values(values).returning();

  const dayKey = dayKeyFor(Date.now(), tzOffsetMin);
  const since = Date.now() - 3 * MS_DAY - tzOffsetMin * 60_000;
  const visible = await fetchVisibleMeals(userId, since);
  const todayMeals = visible.filter(
    (m) => dayKeyFor(m.createdAt.getTime(), tzOffsetMin) === dayKey
  );
  const todayTotals = totalsForMeals(todayMeals, userId);

  return { meal: mealToDto(meal), todayTotals };
}
