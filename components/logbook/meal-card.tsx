/* eslint-disable @next/next/no-img-element -- photos are base64 data URIs, next/image adds nothing */
"use client";

import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/cn";
import type { MealDto } from "@/lib/types";
import { classifyMeal, MEAL_CLASS_TINTS } from "@/lib/meal-class";
import { mineralBadges } from "@/lib/mineral-badges";
import { mealIcon } from "./food-icon";

/**
 * One meal card, shared by the logbook stack and the stats view.
 * Clicking opens the detail dialog (when onClick is given); destructive
 * actions live in the detail dialog, not on the card.
 */
export function MealCard({
  meal,
  budgetKcal,
  scientific,
  onClick,
}: {
  meal: MealDto;
  budgetKcal: number;
  scientific: boolean;
  onClick?: () => void;
}) {
  const title = meal.mealName || meal.description || meal.portion || "Meal";
  const time = formatDistanceToNow(new Date(meal.createdAt), {
    addSuffix: true,
  });
  const Icon = mealIcon(meal.mealName + " " + meal.description);
  const mealClass = classifyMeal(
    meal.mealName + " " + meal.description,
    meal.nutrition
  );
  const badges = mineralBadges(meal.mealName + " " + meal.description);
  const dayPct =
    budgetKcal > 0 ? Math.round((meal.nutrition.kcal / budgetKcal) * 100) : 0;

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border py-2.5 pl-3 pr-2 shadow-soft transition-colors",
        MEAL_CLASS_TINTS[mealClass],
        onClick && "cursor-pointer hover:brightness-[0.98]"
      )}
    >
      {meal.imageData ? (
        <img
          src={meal.imageData}
          alt=""
          className="h-11 w-11 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate text-sm font-medium">{title}</div>
        <div className="truncate text-xs text-muted-foreground">
          {meal.participantIds.length > 1
            ? `shared by ${meal.participantIds.length} - `
            : ""}
          {meal.portion ? `${meal.portion} - ` : ""}
          {time}
        </div>
        {(badges.potassium || badges.magnesium) && (
          <div className="mt-1 flex gap-1">
            {badges.potassium && (
              <span
                title="Rich in potassium"
                className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                potassium
              </span>
            )}
            {badges.magnesium && (
              <span
                title="Rich in magnesium"
                className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                magnesium
              </span>
            )}
          </div>
        )}
      </div>
      <div className="shrink-0 text-right">
        {scientific ? (
          <>
            <div className="text-sm font-semibold">
              {Math.round(meal.nutrition.kcal)} kcal
            </div>
            <div className="text-xs text-muted-foreground">
              P {Math.round(meal.nutrition.proteinG)}g
              {meal.nutrition.sugarG > 0
                ? ` - S ${Math.round(meal.nutrition.sugarG)}g`
                : ""}
            </div>
          </>
        ) : (
          <div className="text-sm font-semibold">{dayPct}%</div>
        )}
      </div>
    </div>
  );
}
