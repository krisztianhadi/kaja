import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { meals, type Suggestion } from "@/lib/db/schema";
import { requireUser, userContextText, geminiApiKey, jsonError } from "@/lib/utils";
import {
  analyzeMeal,
  DEFAULT_BETTER_GEMINI_MODEL,
} from "@/lib/gemini";
import { targetsFromUser, totalsToText, totalsForMeals } from "@/lib/nutrition";
import { targetsWithBudget } from "@/lib/budget";
import { ruleSuggestion } from "@/lib/suggestions";
import { fetchVisibleMeals } from "@/lib/meal-service";
import { mealToDto, dayKeyFor } from "@/lib/stats";
import { mealScaleForUser } from "@/lib/nutrition";
import { parseBackdate } from "@/lib/backdate";
import { budgetForDay } from "@/lib/override";

const MS_DAY = 86_400_000;

/**
 * Re-analyze a meal with a stronger model - the "Analyze again" button
 * shown when the original estimate was not high-confidence. Updates the
 * stored meal in place (same entry, better numbers) and returns the fresh
 * state plus the day totals for the meal's own day.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();

    const [meal] = await db
      .select()
      .from(meals)
      .where(eq(meals.id, params.id))
      .limit(1);

    if (!meal || mealScaleForUser(meal, user.id) <= 0) {
      return jsonError(404, "Meal not found");
    }

    const tzOffsetMin =
      Number(new URL(request.url).searchParams.get("tzOffsetMinutes") ?? "0") ||
      0;

    const apiKey = geminiApiKey(user);
    if (!apiKey) {
      return jsonError(
        503,
        "No Gemini API key configured. Add one in Settings or set GEMINI_TOKEN on the server."
      );
    }

    // the meal's own day (it may be backdated), excluding nothing - the
    // current state of that day is the context for the suggestion
    const dayKey = dayKeyFor(meal.createdAt.getTime(), tzOffsetMin);
    const since = meal.createdAt.getTime() - 3 * MS_DAY - tzOffsetMin * 60_000;
    const visible = await fetchVisibleMeals(user.id, since);
    const dayMeals = visible.filter(
      (m) => dayKeyFor(m.createdAt.getTime(), tzOffsetMin) === dayKey
    );
    const budget = await budgetForDay(user, dayKey);
    const targets = targetsWithBudget(targetsFromUser(user), budget.kcal);
    const dayTotals = totalsForMeals(dayMeals, user.id);
    const rule = ruleSuggestion(dayTotals, targets);

    const betterModel = process.env.GEMINI_MODEL_BETTER || DEFAULT_BETTER_GEMINI_MODEL;

    const result = await analyzeMeal({
      // strip relative-time words from the description for the AI, as on create
      description: parseBackdate(meal.description).clean,
      imageDataUri: meal.imageData || null,
      apiKey,
      model: betterModel,
      userContext: userContextText(user, budget.kcal),
      dayTotalsText: totalsToText(dayTotals, targets),
      ruleSuggestionText: rule.message,
      reanalysis: true,
    });
    const estimate = result.estimate;

    const suggestion: Suggestion = {
      level: rule.level,
      name: rule.name,
      message: rule.message,
      aiConfirmed: estimate.suggestion.confirmsRule,
      aiExtra: estimate.suggestion.extra,
    };

    const n = estimate.nutrition;
    const [updated] = await db
      .update(meals)
      .set({
        kcal: n.kcal,
        proteinG: n.proteinG,
        fatG: n.fatG,
        carbsG: n.carbsG,
        sugarG: n.sugarG,
        sodiumMg: n.sodiumMg,
        mealName: estimate.mealName,
        portion: estimate.portion,
        confidence: estimate.confidence,
        suggestion,
        model: result.model,
      })
      .where(eq(meals.id, meal.id))
      .returning();

    return NextResponse.json({
      meal: mealToDto(updated),
      dayTotals,
      model: result.model,
    });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    const message = err instanceof Error ? err.message : "Re-analysis failed";
    return jsonError(502, `Could not re-analyze the meal: ${message}`);
  }
}
