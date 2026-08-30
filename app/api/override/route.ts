import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, jsonError } from "@/lib/server";
import { dayKeyFor } from "@/lib/stats";
import { setOverride, budgetForDay } from "@/lib/override";

const bodySchema = z.object({
  mode: z.enum(["usual", "more", "less"]),
});

/**
 * Set today's activity override (single tap on the main screen):
 * usual / more active (+250 kcal) / less active (-250 kcal).
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const tzOffsetMin =
      Number(url.searchParams.get("tzOffsetMinutes") ?? "0") || 0;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError(400, "Invalid request body");
    }
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "Invalid mode");
    }

    const dayKey = dayKeyFor(Date.now(), tzOffsetMin);
    await setOverride(user.id, dayKey, parsed.data.mode);
    const budget = await budgetForDay(user, dayKey);

    return NextResponse.json({ mode: parsed.data.mode, budget });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    throw err;
  }
}
