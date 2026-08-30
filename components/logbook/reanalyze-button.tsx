"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { api, tzOffsetMinutes } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { MealDto } from "@/lib/types";
import { Button } from "@/components/ui";

/**
 * "Analyze again" - re-runs the estimate with the stronger Gemini model
 * (gemini-3.6-flash) and updates the meal in place.
 */
export function ReanalyzeButton({
  mealId,
  onDone,
  className,
}: {
  mealId: string;
  onDone: (meal: MealDto) => void;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const data = await api<{ meal: MealDto }>(
        `/api/meals/${mealId}/reanalyze?tzOffsetMinutes=${tzOffsetMinutes()}`,
        { method: "POST" }
      );
      onDone(data.meal);
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Re-analysis failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={run}
        disabled={busy}
        className={cn("w-full", className)}
      >
        <RefreshCw className={cn("h-3.5 w-3.5", busy && "animate-spin")} />
        {busy ? "Analyzing..." : "Analyze again"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
