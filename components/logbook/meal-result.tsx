"use client";

import { CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Nutrition, Suggestion } from "@/lib/db/schema";
import type { MealDto } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { ReanalyzeButton } from "./reanalyze-button";

function formatNumber(n: number): string {
  return Number.isFinite(n) ? String(Math.round(n * 10) / 10) : "-";
}

export function SuggestionBlock({
  suggestion,
  className,
}: {
  suggestion: Suggestion;
  className?: string;
}) {
  // only the AI's suggestion is shown; the repetitive rule-based message
  // stays behind the scenes. Nothing renders when the AI had no extra.
  if (!suggestion.aiExtra) return null;

  const tone =
    suggestion.level === "high"
      ? {
          bg: "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/40 dark:text-amber-200",
          icon: <TriangleAlert className="h-4 w-4 shrink-0 text-amber-600" />,
        }
      : suggestion.level === "watch"
        ? {
            bg: "bg-amber-50/60 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-200",
            icon: <Info className="h-4 w-4 shrink-0 text-amber-600" />,
          }
        : {
            bg: "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900/40 dark:text-emerald-200",
            icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />,
          };

  return (
    <div className={cn("rounded-xl border p-3 text-sm", tone.bg, className)}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5">{tone.icon}</span>
        <p>{suggestion.aiExtra}</p>
      </div>
    </div>
  );
}

export function NutritionGrid({ nutrition }: { nutrition: Nutrition }) {
  const cells = [
    { label: "kcal", value: `${formatNumber(nutrition.kcal)}` },
    { label: "protein", value: `${formatNumber(nutrition.proteinG)} g` },
    { label: "fat", value: `${formatNumber(nutrition.fatG)} g` },
    { label: "carbs", value: `${formatNumber(nutrition.carbsG)} g` },
    { label: "sugar", value: `${formatNumber(nutrition.sugarG)} g` },
    { label: "sodium", value: `${formatNumber(nutrition.sodiumMg)} mg` },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {cells.map((c) => (
        <div
          key={c.label}
          className="rounded-xl bg-secondary/60 px-2 py-1.5 text-center"
        >
          <div className="text-sm font-medium">{c.value}</div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}

type ResultMeal = MealDto;

export function MealResult({
  data,
  onUpdated,
}: {
  data: {
    meal: ResultMeal;
    suggestion: Suggestion;
  };
  onUpdated?: (meal: ResultMeal) => void;
}) {
  const title = data.meal.mealName || data.meal.portion || "Recorded meal";
  return (
    <Card className="border-primary/30">
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-medium">{title}</h3>
            <p className="text-xs text-muted-foreground">
              {data.meal.portion}
              {data.meal.portion && " - "}
              {data.meal.source === "repeat"
                ? "re-recorded from cache, no AI"
                : `AI estimate (${data.meal.confidence} confidence)`}
              {data.meal.model ? ` - ${data.meal.model}` : ""}
            </p>
          </div>
        </div>
        <NutritionGrid nutrition={data.meal.nutrition} />
        <SuggestionBlock suggestion={data.suggestion} />
        {data.meal.confidence !== "high" && data.meal.id && (
          <ReanalyzeButton
            mealId={data.meal.id}
            onDone={(m) => onUpdated?.(m)}
          />
        )}
      </CardContent>
    </Card>
  );
}
