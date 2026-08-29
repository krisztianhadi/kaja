"use client";

import { useQuery } from "@tanstack/react-query";
import { api, tzOffsetMinutes } from "@/lib/api";
import { cn } from "@/lib/cn";
import { severityClass } from "@/lib/severity";
import type { StatsResponse } from "@/lib/types";
import { Progress } from "@/components/ui";

function fmt(n: number): string {
  return Number.isFinite(n) ? String(Math.round(n)) : "0";
}

/** Compact "today so far" strip: kcal bar + key macros vs targets. */
export function TodayStrip() {
  const { data } = useQuery({
    queryKey: ["stats", "daily", "me"],
    queryFn: () =>
      api<StatsResponse>(
        `/api/stats?range=daily&scope=me&tzOffsetMinutes=${tzOffsetMinutes()}`
      ),
  });

  const day = data?.days?.[0];
  if (!data || !day || day.totals.meals === 0) return null;

  const t = data.targets;
  const totals = day.totals;
  const pct = (v: number, target: number) =>
    target > 0 ? Math.round((v / target) * 100) : 0;

  const kcalPct = pct(totals.kcal, t.kcal);
  const macros = [
    { label: "protein", value: totals.proteinG, target: t.proteinG, unit: "g" },
    { label: "fat", value: totals.fatG, target: t.fatG, unit: "g" },
    { label: "sugar", value: totals.sugarG, target: t.sugarG, unit: "g" },
    { label: "sodium", value: totals.sodiumMg, target: t.sodiumMg, unit: "mg" },
  ];

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="font-medium">Today</span>
        <span className="text-muted-foreground">
          {fmt(totals.kcal)} / {fmt(t.kcal)} kcal ({kcalPct}%)
        </span>
      </div>
      <Progress value={kcalPct} barClassName={severityClass(kcalPct)} />
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
        {macros.map((m) => {
          const p = pct(m.value, m.target);
          return (
            <div key={m.label} className="text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span className="capitalize">{m.label}</span>
                <span>
                  {fmt(m.value)}/{fmt(m.target)}
                  {m.unit} ({p}%)
                </span>
              </div>
              <Progress value={p} className="mt-1 h-1.5" barClassName={severityClass(p)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
