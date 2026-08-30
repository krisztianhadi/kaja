/* eslint-disable @next/next/no-img-element -- photos are base64 data URIs, next/image adds nothing */
"use client";

import { formatDistanceToNow } from "date-fns";
import type { MealDto } from "@/lib/types";
import { Button, Card, CardContent } from "@/components/ui";
import { NutritionGrid, SuggestionBlock } from "./meal-result";

/**
 * Meal detail dialog: photo, original feedback, datasheet, and
 * Log again / Close actions. Shared by the logbook and stats views.
 */
export function MealDetailDialog({
  meal,
  busy,
  onClose,
  onLogAgain,
}: {
  meal: MealDto;
  busy?: boolean;
  onClose: () => void;
  onLogAgain: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-sm rounded-t-3xl shadow-lifted sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="space-y-3 pt-4">
          {meal.imageData && (
            <img
              src={meal.imageData}
              alt=""
              className="h-40 w-full rounded-xl object-cover"
            />
          )}
          <div>
            <h3 className="font-medium">
              {meal.mealName || meal.description || "Meal"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {[
                meal.portion,
                meal.participantIds.length > 1
                  ? `shared by ${meal.participantIds.length}`
                  : "",
                formatDistanceToNow(new Date(meal.createdAt), {
                  addSuffix: true,
                }),
                meal.source === "repeat"
                  ? "re-recorded from cache"
                  : `AI estimate (${meal.confidence} confidence)`,
                meal.model ?? "",
              ]
                .filter(Boolean)
                .join(" - ")}
            </p>
          </div>
          <NutritionGrid nutrition={meal.nutrition} />
          {meal.suggestion && <SuggestionBlock suggestion={meal.suggestion} />}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="outline" onClick={onClose} disabled={busy}>
              Close
            </Button>
            <Button onClick={onLogAgain} disabled={busy}>
              {busy ? "Recording..." : "Log again"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
