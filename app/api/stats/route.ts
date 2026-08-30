import { NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/utils";
import { computeStats, dayKeyFor, type Range, type Scope } from "@/lib/stats";
import { targetsFromUser, type Targets } from "@/lib/nutrition";
import { targetsWithBudget, type OverrideMode } from "@/lib/budget";
import { fetchVisibleMeals } from "@/lib/meal-service";
import { budgetForDay, getOverrideMode } from "@/lib/override";

const MS_DAY = 86_400_000;

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);

    const rangeParam = url.searchParams.get("range") ?? "daily";
    if (!["daily", "weekly", "monthly"].includes(rangeParam)) {
      return jsonError(400, "Invalid range");
    }
    const range = rangeParam as Range;

    const scopeParam = url.searchParams.get("scope") ?? "me";
    if (!["me", "family"].includes(scopeParam)) {
      return jsonError(400, "Invalid scope");
    }
    const scope = scopeParam as Scope;

    const tzOffsetMin = Number(url.searchParams.get("tzOffsetMinutes") ?? "0") || 0;
    const date =
      url.searchParams.get("date") ?? dayKeyFor(Date.now(), tzOffsetMin);

    const days = range === "daily" ? 1 : range === "weekly" ? 7 : 30;
    const since = Date.now() - (days + 2) * MS_DAY - tzOffsetMin * 60_000;

    const visible =
      scope === "me"
        ? await fetchVisibleMeals(user.id, since)
        : await fetchVisibleMeals(user.id, since, 500); // family: everything counts

    // effective calorie target = BMR/TDEE budget for the anchor day
    const budget = await budgetForDay(user, date);
    const targets: Targets = targetsWithBudget(
      targetsFromUser(user),
      budget.kcal
    );
    const overrideMode = ((await getOverrideMode(user.id, date)) ??
      "usual") as OverrideMode;

    const stats = computeStats(
      visible,
      scope === "me" ? user.id : null,
      scope,
      range,
      date,
      tzOffsetMin,
      targets
    );

    return NextResponse.json({
      ...stats,
      budget: {
        kcal: budget.kcal,
        overrideMode,
        manual: !budget.auto,
        complete: budget.complete,
      },
    });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    throw err;
  }
}
