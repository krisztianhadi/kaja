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
            bg: "border-[hsl(150_35%_70%)] bg-[hsl(150_30%_95%)] text-[hsl(150_45%_25%)] dark:border-[hsl(150_30%_35%)] dark:bg-[hsl(150_25%_14%)] dark:text-[hsl(150_35%_80%)]",
            icon: (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[hsl(150_45%_30%)]" />
            ),
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
