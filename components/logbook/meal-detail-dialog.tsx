/* eslint-disable @next/next/no-img-element -- photos are base64 data URIs, next/image adds nothing */
"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import type { MealDto } from "@/lib/types";
import { Button, Card, CardContent } from "@/components/ui";
import { NutritionGrid, SuggestionBlock } from "./meal-result";

/**
 * Meal detail dialog: photo, original feedback, datasheet, and
 * Log again / Close actions, plus a Delete action (with inline confirm)
 * when onDelete is given. Shared by the logbook and stats views.
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
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
            <Button variant="outline" onClick={onClose} disabled={busy || deleting}>
              Close
            </Button>
            <Button onClick={onLogAgain} disabled={busy || deleting}>
              {busy ? "Recording..." : "Log again"}
            </Button>
          </div>
          {onDelete && !confirmingDelete && (
            <Button
              type="button"
              variant="outline"
              className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmingDelete(true)}
              disabled={busy || deleting}
            >
              <Trash2 className="h-4 w-4" />
              Delete meal
            </Button>
          )}
          {onDelete && confirmingDelete && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Delete this meal permanently?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={onDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
