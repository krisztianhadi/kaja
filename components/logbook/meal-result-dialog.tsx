/* eslint-disable @next/next/no-img-element -- photos are base64 data URIs, next/image adds nothing */
"use client";

import { formatDistanceToNow } from "date-fns";
import { Check, X } from "lucide-react";
import type { Suggestion } from "@/lib/db/schema";
import type { MealDto } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { NutritionGrid, SuggestionBlock } from "./meal-result";
import { ReanalyzeButton } from "./reanalyze-button";

/**
 * Fresh result shown as a modal right after recording: the estimate with
 * the AI feedback, plus Analyze again (when not high confidence),
 * Save meal (keep it) and Dismiss (remove the just-recorded meal).
 */
export function MealResultDialog({
  meal,
  suggestion,
  busy,
  onSave,
  onDismiss,
  onUpdated,
}: {
  meal: MealDto;
  suggestion: Suggestion;
  busy?: boolean;
  onSave: () => void;
  onDismiss: () => void;
  onUpdated?: (meal: MealDto) => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onSave()}>
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
          <SuggestionBlock suggestion={suggestion} />
          <div className="space-y-2">
            {meal.confidence !== "high" && (
              <ReanalyzeButton mealId={meal.id} onDone={onUpdated ?? (() => {})} />
            )}
            <Button onClick={onSave} disabled={busy} className="w-full">
              <Check className="h-4 w-4" />
              Save meal
            </Button>
            <Button
              variant="outline"
              onClick={onDismiss}
              disabled={busy}
              className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
              Dismiss
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
