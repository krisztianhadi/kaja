/* eslint-disable @next/next/no-img-element -- photos are base64 data URIs, next/image adds nothing */
"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { RotateCcw } from "lucide-react";
import { api, tzOffsetMinutes } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { MealDto } from "@/lib/types";
import { Card, CardContent } from "@/components/ui";

export function MealStack({ onRecorded }: { onRecorded: (meal: MealDto) => void }) {
  const queryClient = useQueryClient();
  const [flashId, setFlashId] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["meals"],
    queryFn: () => api<{ meals: MealDto[] }>("/api/meals?limit=40"),
  });

  const repeat = useMutation({
    mutationFn: (id: string) =>
      api<{ meal: MealDto }>(
        `/api/meals/${id}/repeat?tzOffsetMinutes=${tzOffsetMinutes()}`,
        { method: "POST" }
      ),
    onSuccess: (data) => {
      setFlashId(data.meal.id);
      setTimeout(() => setFlashId(null), 1500);
      onRecorded(data.meal);
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const meals = data?.meals ?? [];

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading meals...</p>;
  }

  if (meals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No meals recorded yet - your logbook is empty.
      </p>
    );
  }

  return (
    <div
      className="max-h-[45vh] space-y-2 overflow-y-auto pb-6 pr-1 [mask-image:linear-gradient(to_bottom,black_88%,transparent)]"
      aria-label="Previously recorded meals"
    >
      {meals.map((meal) => {
        const title =
          meal.mealName || meal.description || meal.portion || "Meal";
        const time = formatDistanceToNow(new Date(meal.createdAt), {
          addSuffix: true,
        });
        return (
          <button
            key={meal.id}
            type="button"
            onClick={() => repeat.mutate(meal.id)}
            disabled={repeat.isPending}
            className={cn(
              "block w-full rounded-lg border bg-card text-left shadow-sm transition-colors hover:bg-accent/40 disabled:opacity-60",
              flashId === meal.id && "ring-2 ring-primary"
            )}
            title="Record this meal again"
          >
            <CardContent className="flex items-center gap-3 py-2.5">
              {meal.imageData ? (
                <img
                  src={meal.imageData}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                  <RotateCcw className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {meal.participantIds.length > 1
                    ? `shared by ${meal.participantIds.length} - `
                    : ""}
                  {meal.portion ? `${meal.portion} - ` : ""}
                  {time}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm font-semibold">
                  {Math.round(meal.nutrition.kcal)} kcal
                </div>
                <div className="text-xs text-muted-foreground">
                  P {Math.round(meal.nutrition.proteinG)}g
                  {meal.nutrition.sugarG > 0
                    ? ` - S ${Math.round(meal.nutrition.sugarG)}g`
                    : ""}
                </div>
              </div>
            </CardContent>
          </button>
        );
      })}
    </div>
  );
}
