import type { Nutrition } from "@/lib/db/schema";
import type { Targets, Totals } from "./nutrition";

/**
 * Deterministic counter-action tips, triggered when a single meal makes a
 * big jump in the day's sugar or sodium (>= 30% of the daily target).
 * Decoupled from the AI suggestion - pure local logic, no model cost.
 * Variety: the tip is picked from a pool via a hash of the meal id, so the
 * same meal always shows the same tip but different meals vary.
 */

const SUGAR_TIPS = [
  "Feeling jittery or wired after that? A few nuts or Greek yogurt can help settle it - or step somewhere cooler for a bit.",
  "Big sugar spike - protein or healthy fats now (eggs, chicken, nuts) keep your energy steadier than more carbs.",
  "Sweet hit - drink water and take a short walk to smooth out the spike.",
  "Sugar-heavy meal - next time pair the sweet with protein or fat; it slows the sugar rush.",
  "That was a sweet one - some protein now (egg, chicken, tofu) will keep you from crashing later.",
];

const SODIUM_TIPS = [
  "Very salty meal - drink extra water today to help your body flush the salt.",
  "High sodium - balance it with potassium: banana, coconut water, or leafy greens.",
  "Salty - keep sipping water through the day; a banana or avocado helps your system handle it.",
  "Big sodium hit - extra water plus a potassium snack (banana, papaya) makes it easier.",
  "Salty plate - your body needs water to deal with it; keep a bottle nearby today.",
];

// the day is already past the target: no more food suggestions, only stop/lighten
const SUGAR_OVER_TIPS = [
  "You are past your sugar target for today - skip anything sweet for the rest of the day.",
  "Sugar done for today - water and a short walk beat any snack right now.",
  "Past the sugar budget - if you feel a craving, it passes faster with a glass of water.",
  "Sugar quota is spent - anything else sweet can wait until tomorrow.",
  "You had enough sugar for today - the next thing you drink should be plain water.",
];

const SODIUM_OVER_TIPS = [
  "You are past your sodium target - keep drinking water and go easy on salt from here.",
  "Sodium done for today - water, water, water; no need for more salty food.",
  "Past the sodium budget - light, fresh food only for the rest of the day.",
  "Sodium quota is spent - fresh fruit or plain rice beats anything pickled or fried now.",
  "Enough salt for today - keep the water flowing and let tomorrow be fresh.",
];

// the day is over calories: the strongest signal - stop eating, full stop
const STOP_OVER_TIPS = [
  "You are over your calorie target for today - it is time to stop eating.",
  "The day budget is done - put the fork down, the log will still work.",
  "Over budget for today - stop eating and let your body catch up.",
  "Enough for today - close the logbook and have some water instead.",
  "Today is full - nothing more to add, and that is perfectly okay.",
];

/** Threshold: a meal counts as a "big jump" when it carries this much of the day's target. */
const JUMP_RATIO = 0.3;

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export interface DayTip {
  kind: "stop" | "sugar" | "sodium";
  tip: string;
}

export function dayTipForMeal(
  mealId: string,
  nutrition: Pick<
    Nutrition,
    "kcal" | "proteinG" | "fatG" | "carbsG" | "sugarG" | "sodiumMg"
  >,
  targets: Targets,
  dayTotals?: Pick<Totals, "kcal" | "sugarG" | "sodiumMg">
): DayTip | null {
  const sugarRatio = targets.sugarG > 0 ? nutrition.sugarG / targets.sugarG : 0;
  const sodiumRatio =
    targets.sodiumMg > 0 ? nutrition.sodiumMg / targets.sodiumMg : 0;

  const dayKcalOver =
    !!dayTotals && targets.kcal > 0 && dayTotals.kcal > targets.kcal;
  const daySugarOver =
    !!dayTotals && targets.sugarG > 0 && dayTotals.sugarG > targets.sugarG;
  const daySodiumOver =
    !!dayTotals &&
    targets.sodiumMg > 0 &&
    dayTotals.sodiumMg > targets.sodiumMg * 1.15;

  // over calories is the strongest signal - stop eating, not sugar advice
  if (dayKcalOver) {
    return {
      kind: "stop",
      tip: STOP_OVER_TIPS[hashId(mealId) % STOP_OVER_TIPS.length],
    };
  }

  // the day is already past a target: warn to stop/lighten, never add food
  if (daySugarOver || daySodiumOver) {
    const pool =
      daySugarOver && (!daySodiumOver || sugarRatio >= sodiumRatio)
        ? SUGAR_OVER_TIPS
        : SODIUM_OVER_TIPS;
    return {
      kind: pool === SUGAR_OVER_TIPS ? "sugar" : "sodium",
      tip: pool[hashId(mealId) % pool.length],
    };
  }

  if (sugarRatio < JUMP_RATIO && sodiumRatio < JUMP_RATIO) return null;

  const pool =
    sugarRatio >= sodiumRatio ? SUGAR_TIPS : SODIUM_TIPS;
  const tip = pool[hashId(mealId) % pool.length];
  return {
    kind: sugarRatio >= sodiumRatio ? "sugar" : "sodium",
    tip,
  };
}
