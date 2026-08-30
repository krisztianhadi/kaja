"use client";

import { useQuery } from "@tanstack/react-query";
import { Lightbulb } from "lucide-react";
import { api, tzOffsetMinutes } from "@/lib/api";
import { cn } from "@/lib/cn";
import { severityClass } from "@/lib/severity";
import { dayTipForMeal } from "@/lib/tips";
import type { StatsResponse } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/components/user-context";

function fmt(n: number): string {
  return Number.isFinite(n) ? String(Math.round(n)) : "0";
}

/** Today's calorie budget + intake bars (percentages, or exact in scientific view). */
export function TodayStrip() {
  const user = useUser();
  const scientific = user?.scientific ?? false;

  const { data } = useQuery({
    queryKey: ["stats", "daily", "me"],
    queryFn: () =>
      api<StatsResponse>(
        `/api/stats?range=daily&scope=me&tzOffsetMinutes=${tzOffsetMinutes()}`
      ),
  });

  if (!data) return null;

  const budget = data.budget;
  const day = data.days?.[0];
  const totals = day?.totals;
  const t = data.targets;

  const note = budget.manual
    ? "manual goal set in Settings"
    : budget.overrideMode === "more"
      ? "+250 bonus for being more active"
      : budget.overrideMode === "less"
        ? "-250 adjustment for being less active"
        : null;

  const kcalPct = totals && t.kcal > 0 ? (totals.kcal / t.kcal) * 100 : 0;

  // deterministic counter-action tip: triggered when the newest meal made
  // a big jump in the day's sugar or sodium (decoupled from the AI)
  const newestMeal = day?.meals?.[0];
  const dayTip = newestMeal
    ? dayTipForMeal(
        newestMeal.id,
        newestMeal.nutrition,
        t,
        totals ? { sugarG: totals.sugarG, sodiumMg: totals.sodiumMg } : undefined
      )
    : null;

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft">
      <div className="text-xs text-muted-foreground">Today's budget</div>
      {scientific && (
        <div className="text-2xl font-bold">{fmt(budget.kcal)} kcal</div>
      )}
      {scientific &&
        (note ? (
          <div className="mt-0.5 text-xs font-medium text-primary">{note}</div>
        ) : null)}
      {!budget.complete && (
        <div className="mt-0.5 text-xs text-muted-foreground">
          Add age and gender in Settings for an accurate budget.
        </div>
      )}

      {totals && totals.meals > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="font-semibold">Calories</span>
            <span className="text-muted-foreground">
              {scientific
                ? `${fmt(totals.kcal)} / ${fmt(t.kcal)} kcal (${Math.round(kcalPct)}%)`
                : `${Math.round(kcalPct)}%`}
            </span>
          </div>
          <Progress value={kcalPct} aria-label="Calories intake" barClassName={severityClass(kcalPct)} />
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
            {[
              { label: "protein", value: totals.proteinG, target: t.proteinG, unit: "g" },
              { label: "fat", value: totals.fatG, target: t.fatG, unit: "g" },
              { label: "sugar", value: totals.sugarG, target: t.sugarG, unit: "g" },
              { label: "sodium", value: totals.sodiumMg, target: t.sodiumMg, unit: "mg" },
            ].map((m) => {
              const p = m.target > 0 ? (m.value / m.target) * 100 : 0;
              return (
                <div key={m.label} className="text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span className="capitalize">{m.label}</span>
                    <span className={cn(scientific && "font-medium text-foreground")}>
                      {scientific
                        ? `${fmt(m.value)}/${fmt(m.target)}${m.unit} (${Math.round(p)}%)`
                        : `${Math.round(p)}%`}
                    </span>
                  </div>
                  <Progress value={p} className="mt-1" aria-label={`${m.label} intake`} barClassName={severityClass(p)} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {dayTip && (
        <div
          className={cn(
            "mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm",
            dayTip.kind === "sugar"
              ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200"
              : "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-200"
          )}
        >
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm">{dayTip.tip}</p>
        </div>
      )}
    </div>
  );
}
