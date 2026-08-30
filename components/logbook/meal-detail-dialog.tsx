/* eslint-disable @next/next/no-img-element -- photos are base64 data URIs, next/image adds nothing */
"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { RotateCcw, Trash2, X } from "lucide-react";
import type { MealDto } from "@/lib/types";
import { Button, Card, CardContent } from "@/components/ui";
import { NutritionGrid, SuggestionBlock } from "./meal-result";

/**
 * Meal detail dialog: photo, original feedback, datasheet, then the
 * Delete action (opens a separate confirmation modal) above the
 * Close / Log again pair. Shared by the logbook and stats views.
 */
export function MealDetailDialog({
  meal,
  busy,
  deleting,
  onClose,
  onLogAgain,
  onDelete,
}: {
  meal: MealDto;
  busy?: boolean;
  deleting?: boolean;
  onClose: () => void;
  onLogAgain: () => void;
  onDelete?: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
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
            {onDelete && (
              <Button
                type="button"
                variant="outline"
                className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmOpen(true)}
                disabled={busy || deleting}
              >
                <Trash2 className="h-4 w-4" />
                Delete meal
              </Button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={busy || deleting}
              >
                <X className="h-4 w-4" />
                Close
              </Button>
              <Button onClick={onLogAgain} disabled={busy || deleting}>
                <RotateCcw className="h-4 w-4" />
                {busy ? "Recording..." : "Log again"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[51] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setConfirmOpen(false)}
        >
          <Card
            className="w-full max-w-sm rounded-t-3xl shadow-lifted sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="space-y-3 pt-4">
              <h3 className="font-medium">Delete this meal?</h3>
              <p className="text-sm text-muted-foreground">
                {meal.mealName || meal.description || "Meal"} -{" "}
                {Math.round(meal.nutrition.kcal)} kcal
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmOpen(false)}
                  disabled={deleting}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={onDelete}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
