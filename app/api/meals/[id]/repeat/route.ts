import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { meals } from "@/lib/db/schema";
import { requireUser, jsonError } from "@/lib/server";
import { mealScaleForUser } from "@/lib/nutrition";
import { recordMeal } from "@/lib/meal-service";
export const dynamic = "force-dynamic";


/**
 * Re-record a previous meal from the card stack: copies the stored nutrition
 * estimate - no AI call, no text/photo analysis.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const [original] = await db
      .select()
      .from(meals)
      .where(eq(meals.id, params.id))
      .limit(1);

    if (!original || mealScaleForUser(original, user.id) <= 0) {
      return jsonError(404, "Meal not found");
    }

    const tzOffsetMin = Number(
      new URL(request.url).searchParams.get("tzOffsetMinutes") ?? "0"
    ) || 0;

    const { meal, todayTotals } = await recordMeal(
      {
        authorId: user.id,
        participantIds: original.participantIds,
        description: original.description,
        imageData: original.imageData,
        kcal: original.kcal,
        proteinG: original.proteinG,
        fatG: original.fatG,
        carbsG: original.carbsG,
        sugarG: original.sugarG,
        sodiumMg: original.sodiumMg,
        mealName: original.mealName,
        portion: original.portion,
        confidence: original.confidence,
        source: "repeat",
        suggestion: original.suggestion,
        model: original.model,
      },
      user.id,
      tzOffsetMin
    );

    return NextResponse.json({ meal, totals: todayTotals });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    throw err;
  }
}
