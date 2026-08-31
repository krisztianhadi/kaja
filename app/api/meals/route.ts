import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { meals, users, type Suggestion } from "@/lib/db/schema";
import { requireUser, userContextText, geminiApiKey, jsonError } from "@/lib/server";
import { analyzeMeal, DEFAULT_GEMINI_MODEL } from "@/lib/gemini";
import {
  targetsFromUser,
  totalsToText,
  totalsForMeals,
} from "@/lib/nutrition";
import { targetsWithBudget } from "@/lib/budget";
import { rateLimitAi } from "@/lib/rate-limit";
import { ruleSuggestion } from "@/lib/suggestions";
import { budgetForDay, getOverrideMode } from "@/lib/override";
import { fetchVisibleMeals, recordMeal } from "@/lib/meal-service";
import { mealToDto, dayKeyFor } from "@/lib/stats";
import { parseBackdate } from "@/lib/backdate";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const MS_DAY = 86_400_000;

/** Recent meals visible to the user - the re-record card stack. */
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "40") || 40, 100);
    const meals = await fetchVisibleMeals(user.id, 0, limit);
    return NextResponse.json({ meals: meals.map((m) => mealToDto(m)) });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    throw err;
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return jsonError(400, "Invalid form data");
    }

    const description = String(form.get("description") ?? "").trim().slice(0, 2000);

    let participantIds: string[] = [];
    const rawParticipants = form.get("participantIds");
    if (rawParticipants) {
      try {
        const parsed = JSON.parse(String(rawParticipants));
        if (Array.isArray(parsed)) {
          participantIds = parsed.filter((x): x is string => typeof x === "string").slice(0, 20);
        }
      } catch {
        return jsonError(400, "Invalid participants");
      }
    }

    // only real family members can be participants
    if (participantIds.length > 0) {
      const valid = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.id, participantIds));
      const validSet = new Set(valid.map((u) => u.id));
      participantIds = participantIds.filter((id) => validSet.has(id));
    }
    // the author is always a participant
    const participants = [...new Set([user.id, ...participantIds])];

    // optional photo (already downscaled client-side, enforced again here)
    let imageDataUri = "";
    const imageDataField = form.get("imageData");
    if (typeof imageDataField === "string" && imageDataField.length > 0) {
      if (imageDataField.length > MAX_IMAGE_BYTES * 1.4) {
        return jsonError(400, "Image too large (max 4MB)");
      }
      const m = /^data:([^;]+);base64,/.exec(imageDataField);
      if (!m || !ALLOWED_MIME.has(m[1])) {
        return jsonError(400, "Unsupported image type");
      }
      imageDataUri = imageDataField;
    }
    const imageFile = form.get("image");
    if (!imageDataUri && imageFile && typeof imageFile === "object" && "arrayBuffer" in imageFile) {
      const file = imageFile as File;
      if (file.size > MAX_IMAGE_BYTES) {
        return jsonError(400, "Image too large (max 4MB)");
      }
      if (!ALLOWED_MIME.has(file.type)) {
        return jsonError(400, "Unsupported image type");
      }
      const buf = Buffer.from(await file.arrayBuffer());
      imageDataUri = `data:${file.type};base64,${buf.toString("base64")}`;
    }

    if (!description && !imageDataUri) {
      return jsonError(400, "Add a description, a photo, or both");
    }

    // paid AI call budget - 15/hour per user
    const ai = rateLimitAi(user.id);
    if (!ai.allowed) {
      return jsonError(
        429,
        `Too many analyses this hour - try again in about ${Math.ceil(ai.retryAfterSeconds / 60)} minutes`
      );
    }

    const tzOffsetMin = Number(form.get("tzOffsetMinutes") ?? "0") || 0;
    const dayKey = dayKeyFor(Date.now(), tzOffsetMin);

    // backdate from relative time words ("yesterday", "2 days ago", ...);
    // the AI gets the description with the time phrase removed
    const { clean, createdAt } = parseBackdate(description);

    // effective kcal target = today's BMR/TDEE budget; the activity
    // override also scales the sodium target in hot climates
    const overrideMode = (await getOverrideMode(user.id, dayKey)) ?? "usual";
    const budget = await budgetForDay(user, dayKey);
    const targets = targetsWithBudget(targetsFromUser(user, overrideMode), budget.kcal);

    // today's totals so far (me scope) - for the suggestion and the AI prompt
    const since = Date.now() - 3 * MS_DAY - tzOffsetMin * 60_000;
    const visible = await fetchVisibleMeals(user.id, since);
    const todayMeals = visible.filter(
      (m) => dayKeyFor(m.createdAt.getTime(), tzOffsetMin) === dayKey
    );
    const totalsBefore = totalsForMeals(todayMeals, user.id);
    const rule = ruleSuggestion(totalsBefore, targets);

    const apiKey = geminiApiKey(user);
    if (!apiKey) {
      return jsonError(
        503,
        "No Gemini API key configured. Add one in Settings or set GEMINI_TOKEN on the server."
      );
    }

    const result = await analyzeMeal({
      description: clean,
      imageDataUri: imageDataUri || null,
      apiKey,
      model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
      userContext: userContextText(user, budget.kcal),
      dayTotalsText: totalsToText(totalsBefore, targets),
      ruleSuggestionText: rule.message,
      location: user.region ?? undefined,
    });
    const estimate = result.estimate;

    // not food (brick, plastic, electronics, ...) - never save it, tell the
    // client so it can show the fun "not food" modal instead
    if (estimate.isFood === false) {
      return NextResponse.json({
        notFood: true,
        mealName: estimate.mealName || null,
        description: description.slice(0, 120),
      });
    }

    const suggestion: Suggestion = {
      level: rule.level,
      name: rule.name,
      message: rule.message,
      aiConfirmed: estimate.suggestion.confirmsRule,
      aiExtra: estimate.suggestion.extra,
    };

    const n = estimate.nutrition;
    const { meal, todayTotals } = await recordMeal(
      {
        authorId: user.id,
        participantIds: participants,
        description,
        imageData: imageDataUri,
        kcal: n.kcal,
        proteinG: n.proteinG,
        fatG: n.fatG,
        carbsG: n.carbsG,
        sugarG: n.sugarG,
        sodiumMg: n.sodiumMg,
        mealName: estimate.mealName,
        portion: estimate.portion,
        confidence: estimate.confidence,
        source: "ai",
        suggestion,
        model: result.model,
        ...(createdAt ? { createdAt } : {}),
      },
      user.id,
      tzOffsetMin
    );

    return NextResponse.json({ meal, totals: todayTotals, suggestion });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    // log the real cause server-side, never leak upstream details to the client
    console.error("meal analysis failed:", err);
    return jsonError(502, "Could not analyze the meal - please try again");
  }
}
