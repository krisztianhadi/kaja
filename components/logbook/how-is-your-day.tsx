"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, tzOffsetMinutes } from "@/lib/api";
import type { StatsResponse } from "@/lib/types";
import { Segmented } from "@/components/ui";

/**
 * "How is your day" - one-tap activity override for today.
 * lazy = less active than usual (-250), average = usual, active = more (+250).
 */
export function HowIsYourDay() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["stats", "daily", "me"],
    queryFn: () =>
      api<StatsResponse>(
        `/api/stats?range=daily&scope=me&tzOffsetMinutes=${tzOffsetMinutes()}`
      ),
  });

  async function setMode(mode: "usual" | "more" | "less") {
    try {
      await api(`/api/override?tzOffsetMinutes=${tzOffsetMinutes()}`, {
        method: "POST",
        body: JSON.stringify({ mode }),
      });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    } catch {
      // ignore - the strip keeps its previous state
    }
  }

  if (!data) return null;

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft">
      <div className="mb-2 text-xs text-muted-foreground">How is your day</div>
      <Segmented<"less" | "usual" | "more">
        fullWidth
        value={data.budget.overrideMode}
        onChange={setMode}
        options={[
          { value: "less", label: "Lazy" },
          { value: "usual", label: "Average" },
          { value: "more", label: "Active" },
        ]}
      />
    </div>
  );
}
