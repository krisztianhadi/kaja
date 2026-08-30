"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, tzOffsetMinutes } from "@/lib/api";
import { cn } from "@/lib/cn";
import { severityClass } from "@/lib/severity";
import type { StatsResponse } from "@/lib/types";
import { Progress } from "@/components/ui";

function fmt(n: number): string {
  return Number.isFinite(n) ? String(Math.round(n)) : "0";
}

/**
 * "How is your day" - one-tap activity override for today.
 * lazy = less active than usual (-250), average = usual, active = more (+250).
 */
export function HowIsYourDay() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["stats", "daily", "me"],
    queryFn: () =>
      api<StatsResponse>(
        `/api/stats?range=daily&scope=me&tzOffsetMinutes=${tzOffsetMinutes()}`
      ),
  });

  async function setMode(mode: "usual" | "more" | "less") {
    setSaving(true);
    try {
      await api(`/api/override?tzOffsetMinutes=${tzOffsetMinutes()}`, {
        method: "POST",
        body: JSON.stringify({ mode }),
      });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    } catch {
      // ignore - the strip keeps its previous state
    } finally {
      setSaving(false);
    }
  }

  if (!data) return null;

  const options = [
    { mode: "less" as const, label: "Lazy" },
    { mode: "usual" as const, label: "Average" },
    { mode: "more" as const, label: "Active" },
  ];

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft">
      <div className="mb-2 text-xs text-muted-foreground">How is your day</div>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.mode}
            type="button"
            disabled={saving}
            onClick={() => setMode(opt.mode)}
            className={cn(
              "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50",
              data.budget.overrideMode === opt.mode
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-accent"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
