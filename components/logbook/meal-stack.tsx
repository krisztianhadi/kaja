"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, tzOffsetMinutes } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { MealDto } from "@/lib/types";
import { useToast } from "@/components/toast";
import { MealCard } from "./meal-card";
import { MealDetailDialog } from "./meal-detail-dialog";

export function MealStack({
  onRecorded,
  budgetKcal,
  scientific,
}: {
  onRecorded: (meal: MealDto) => void;
  budgetKcal: number;
  scientific: boolean;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<MealDto | null>(null);
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
      setSelected(null);
      setFlashId(data.meal.id);
      setTimeout(() => setFlashId(null), 1500);
      onRecorded(data.meal);
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const deleteMeal = useMutation({
    mutationFn: (id: string) => api(`/api/meals/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast("Meal deleted");
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (err) => {
      toast(
        err instanceof Error ? err.message : "Could not delete the meal",
        "error"
      );
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
    <>
      <div
        className="max-h-[45vh] space-y-2 overflow-y-auto pb-6 pr-1 [mask-image:linear-gradient(to_bottom,black_88%,transparent)]"
        aria-label="Previously recorded meals"
      >
        {meals.map((meal) => (
          <div
            key={meal.id}
            className={cn(flashId === meal.id && "rounded-2xl ring-2 ring-primary")}
          >
            <MealCard
              meal={meal}
              budgetKcal={budgetKcal}
              scientific={scientific}
              onClick={() => setSelected(meal)}
            />
          </div>
        ))}
      </div>

      {selected && (
        <MealDetailDialog
          meal={selected}
          busy={repeat.isPending}
          deleting={deleteMeal.isPending}
          onClose={() => setSelected(null)}
          onLogAgain={() => repeat.mutate(selected.id)}
          onDelete={() => deleteMeal.mutate(selected.id)}
        />
      )}
    </>
  );
}
