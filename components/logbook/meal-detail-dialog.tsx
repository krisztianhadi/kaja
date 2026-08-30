/* eslint-disable @next/next/no-img-element -- photos are base64 data URIs, next/image adds nothing */
"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { RotateCcw, Trash2, X } from "lucide-react";
import type { MealDto } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { NutritionGrid, SuggestionBlock } from "./meal-result";

/**
 * Meal detail dialog: photo, original feedback, datasheet, then the
 * Delete action (opens a separate confirmation dialog) above the
 * Log again / Close actions. Shared by the logbook and stats views.
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
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <div className="space-y-3">
            {meal.imageData && (
              <img
                src={meal.imageData}
                alt=""
                className="h-40 w-full rounded-xl object-cover"
              />
            )}
            <div>
              <DialogTitle className="text-base font-medium">
                {meal.mealName || meal.description || "Meal"}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs">
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
              </DialogDescription>
            </div>
            <NutritionGrid nutrition={meal.nutrition} />
            {meal.suggestion && <SuggestionBlock suggestion={meal.suggestion} />}
            <div className="space-y-2">
              {onDelete && (
                <Button
                  variant="outline"
                  className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmOpen(true)}
                  disabled={busy || deleting}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete meal
                </Button>
              )}
              <Button
                onClick={onLogAgain}
                disabled={busy || deleting}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4" />
                {busy ? "Recording..." : "Log again"}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={busy || deleting}
                className="w-full"
              >
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {confirmOpen && (
        <Dialog open onOpenChange={(open) => !open && setConfirmOpen(false)}>
          <DialogContent>
            <div className="space-y-3">
              <DialogTitle className="text-base font-medium">
                Delete this meal?
              </DialogTitle>
              <DialogDescription>
                {meal.mealName || meal.description || "Meal"} -{" "}
                {Math.round(meal.nutrition.kcal)} kcal
              </DialogDescription>
              <div className="space-y-2">
                <Button
                  variant="destructive"
                  onClick={onDelete}
                  disabled={deleting}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setConfirmOpen(false)}
                  disabled={deleting}
                  className="w-full"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
