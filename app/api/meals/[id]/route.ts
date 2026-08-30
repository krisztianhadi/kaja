import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { meals } from "@/lib/db/schema";
import { requireUser, jsonError } from "@/lib/server";
import { mealScaleForUser } from "@/lib/nutrition";

/** Delete a meal the user can see (authored or shared with them). */
export async function DELETE(
  _request: Request,
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

    await db.delete(meals).where(eq(meals.id, meal.id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    throw err;
  }
}
