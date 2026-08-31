/* eslint-disable @next/next/no-img-element -- photos are base64 data URIs, next/image adds nothing */
"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { RotateCcw, Trash2, X } from "lucide-react";
import type { MealDto } from "@/lib/types";
import { api } from "@/lib/api";
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
 * Stats responses omit photos - the dialog fetches the full meal
 * (including the image) on demand when the passed one has none.
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
  const [full, setFull] = useState<MealDto | null>(null);
  const mealId = meal.id;
  const hasImage = !!meal.imageData;

  // stats-sourced meals have no photo - fetch the full record once
  useEffect(() => {
    if (hasImage) {
      setFull(null);
      return;
    }
    let alive = true;
    api<{ meal: MealDto }>(`/api/meals/${mealId}`)
      .then((res) => alive && setFull(res.meal))
      .catch(() => alive && setFull(null));
    return () => {
      alive = false;
    };
  }, [mealId, hasImage]);

  const shown = full ?? meal;

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <div className="space-y-3">
            {shown.imageData && (
              <img
                src={shown.imageData}
                alt=""
                className="h-40 w-full rounded-xl object-cover"
              />
            )}
            <div>
              <DialogTitle className="text-base font-medium">
                {shown.mealName || shown.description || "Meal"}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs">
                {[
                  shown.portion,
                  shown.participantIds.length > 1
                    ? `shared by ${shown.participantIds.length}`
                    : "",
                  formatDistanceToNow(new Date(shown.createdAt), {
                    addSuffix: true,
                  }),
                  shown.source === "repeat"
                    ? "re-recorded from cache"
                    : `AI estimate (${shown.confidence} confidence)`,
                  shown.model ?? "",
                ]
                  .filter(Boolean)
                  .join(" - ")}
              </DialogDescription>
            </div>
            <NutritionGrid nutrition={shown.nutrition} />
            {shown.suggestion && (
<SuggestionBlock suggestion={shown.suggestion} />
              )}
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
                {shown.mealName || shown.description || "Meal"} -{" "}
                {Math.round(shown.nutrition.kcal)} kcal
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
