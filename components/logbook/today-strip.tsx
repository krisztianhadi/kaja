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

const OVERRIDE_OPTIONS = [
  { mode: "usual" as const, label: "Usual" },
  { mode: "more" as const, label: "+250" },
  { mode: "less" as const, label: "-250" },
];

/** Today's calorie budget + intake bars. Budget is always shown. */
export function TodayStrip() {
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

  const budget = data.budget;
  const day = data.days?.[0];
  const totals = day?.totals;
  const t = data.targets;

  const note = budget.manual
    ? "manual goal set in Settings"
    : budget.overrideMode === "more"
      ? "+250 bonus for being more active"
      : budget.overrideMode === "less"
        ? "-250 adjustment for being less active"
        : null;

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Today's budget</div>
          <div className="text-2xl font-bold">
            {fmt(budget.kcal)} kcal
          </div>
          {note && (
            <div className="mt-0.5 text-xs font-medium text-primary">{note}</div>
          )}
          {!budget.complete && (
            <div className="mt-0.5 text-xs text-muted-foreground">
              Add age and gender in Settings for an accurate budget.
            </div>
          )}
        </div>
        <div className="flex gap-1">
          {OVERRIDE_OPTIONS.map((opt) => (
            <button
              key={opt.mode}
              type="button"
              disabled={saving}
              onClick={() => setMode(opt.mode)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                budget.overrideMode === opt.mode
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-accent"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {totals && totals.meals > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="font-semibold">Today</span>
            <span className="text-muted-foreground">
              {fmt(totals.kcal)} / {fmt(t.kcal)} kcal (
              {Math.round((totals.kcal / Math.max(1, t.kcal)) * 100)}%)
            </span>
          </div>
          <Progress
            value={(totals.kcal / Math.max(1, t.kcal)) * 100}
            barClassName={severityClass((totals.kcal / Math.max(1, t.kcal)) * 100)}
          />
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
            {[
              { label: "protein", value: totals.proteinG, target: t.proteinG, unit: "g" },
              { label: "fat", value: totals.fatG, target: t.fatG, unit: "g" },
              { label: "sugar", value: totals.sugarG, target: t.sugarG, unit: "g" },
              { label: "sodium", value: totals.sodiumMg, target: t.sodiumMg, unit: "mg" },
            ].map((m) => {
              const p = m.target > 0 ? (m.value / m.target) * 100 : 0;
              return (
                <div key={m.label} className="text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span className="capitalize">{m.label}</span>
                    <span>
                      {fmt(m.value)}/{fmt(m.target)}
                      {m.unit} ({Math.round(p)}%)
                    </span>
                  </div>
                  <Progress value={p} className="mt-1" barClassName={severityClass(p)} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
