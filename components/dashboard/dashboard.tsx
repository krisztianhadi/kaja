"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api, tzOffsetMinutes } from "@/lib/api";
import { dayKeyFor } from "@/lib/client-date";
import { cn } from "@/lib/cn";
import { severityClass } from "@/lib/severity";
import type { MealDto, StatsResponse } from "@/lib/types";
import { useUser } from "@/components/user-context";
import { useToast } from "@/components/toast";
import { MealCard } from "@/components/logbook/meal-card";
import { MealDetailDialog } from "@/components/logbook/meal-detail-dialog";
import { Button, Card, CardContent, Progress, Segmented } from "@/components/ui";

type Range = "daily" | "weekly" | "monthly";
type Scope = "me" | "family";

function fmt(n: number): string {
  return Number.isFinite(n) ? String(Math.round(n)) : "0";
}

function fmtK(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : fmt(n);
}

function pctOf(v: number, target: number): number {
  return target > 0 ? Math.round((v / target) * 100) : 0;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="py-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-xl font-semibold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function KcalBars({
  days,
  scope,
}: {
  days: StatsResponse["days"];
  scope: Scope;
}) {
  const max = Math.max(...days.map((d) => d.totals.kcal), 1);
  const showLabels = days.length <= 8;
  return (
    <div className="flex h-32 items-end gap-1">
      {days.map((d, i) => {
        const h = d.totals.kcal > 0 ? Math.max(4, (d.totals.kcal / max) * 100) : 0;
        return (
          <div key={d.date} className="flex h-full flex-1 flex-col justify-end">
            <div
              className={cn(
                "w-full rounded-t bg-primary",
                d.totals.kcal === 0 && "bg-secondary"
              )}
              style={{ height: `${h}%` }}
              title={`${d.date}: ${fmt(d.totals.kcal)} kcal`}
            />
            {showLabels && (
              <div className="mt-1 text-center text-[10px] text-muted-foreground">
                {format(parseISO(d.date), "EEE")}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MacroBar({ label, value, target, unit, showPct }: {
  label: string;
  value: number;
  target: number;
  unit: string;
  showPct: boolean;
}) {
  const p = pctOf(value, target);
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="capitalize text-muted-foreground">{label}</span>
        <span>
          {fmt(value)}{unit}
          {showPct && ` / ${fmt(target)}${unit} (${p}%)`}
        </span>
      </div>
      <Progress
        value={showPct ? p : 0}
        className="mt-1"
        barClassName={severityClass(p)}
      />
    </div>
  );
}

export function Dashboard() {
  const [range, setRange] = useState<Range>("daily");
  const [scope, setScope] = useState<Scope>("me");
  const [date, setDate] = useState<string | null>(null);

  const today = dayKeyFor(Date.now(), new Date().getTimezoneOffset());
  const anchor = range === "daily" ? (date ?? today) : today;

  const { data, isPending } = useQuery({
    queryKey: ["stats", range, scope, anchor],
    queryFn: () =>
      api<StatsResponse>(
        `/api/stats?range=${range}&scope=${scope}&date=${anchor}&tzOffsetMinutes=${tzOffsetMinutes()}`
      ),
  });

  function shiftDay(delta: number) {
    const [y, m, d] = anchor.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + delta));
    setDate(
      `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(
        dt.getUTCDate()
      ).padStart(2, "0")}`
    );
  }

  const showPct = scope === "me";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Segmented<Range>
          fullWidth
          value={range}
          onChange={setRange}
          options={[
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
          ]}
        />
        <Segmented<Scope>
          fullWidth
          value={scope}
          onChange={setScope}
          options={[
            { value: "me", label: "Me" },
            { value: "family", label: "Family" },
          ]}
        />
      </div>

      {scope === "family" && (
        <p className="text-xs text-muted-foreground">
          Family totals count every meal once - in your personal view shared
          meals are split equally between participants.
        </p>
      )}

      {isPending && <p className="text-sm text-muted-foreground">Loading...</p>}

      {data && range === "daily" && (
        <DailyView data={data} onShift={shiftDay} showPct={showPct} />
      )}
      {data && range === "weekly" && <WeeklyView data={data} showPct={showPct} />}
      {data && range === "monthly" && <MonthlyView data={data} showPct={showPct} />}
    </div>
  );
}

function DayHeader({ date, onShift }: { date: string; onShift: (d: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" size="icon" onClick={() => onShift(-1)} aria-label="Previous day">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="text-center">
        <div className="text-sm font-medium">{format(parseISO(date), "EEEE, MMM d")}</div>
        <div className="text-xs text-muted-foreground">
          {format(parseISO(date), "yyyy")}
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={() => onShift(1)} aria-label="Next day">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function DailyView({
  data,
  onShift,
  showPct,
}: {
  data: StatsResponse;
  onShift: (d: number) => void;
  showPct: boolean;
}) {
  const user = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const scientific = user?.scientific ?? false;

  const [selected, setSelected] = useState<MealDto | null>(null);

  const deleteMeal = useMutation({
    mutationFn: (id: string) =>
      api(`/api/meals/${id}`, { method: "DELETE" }),
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

  const repeat = useMutation({
    mutationFn: (id: string) =>
      api<{ meal: MealDto }>(
        `/api/meals/${id}/repeat?tzOffsetMinutes=${tzOffsetMinutes()}`,
        { method: "POST" }
      ),
    onSuccess: () => {
      toast("Meal recorded again");
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const day = data.days[0];
  const t = data.targets;
  if (!day) return null;
  const { totals } = day;
  const kcalPct = pctOf(totals.kcal, t.kcal);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 pt-4">
          <DayHeader date={day.date} onShift={onShift} />
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">
              {fmt(totals.kcal)} kcal {showPct && `/ ${fmt(t.kcal)}`}
            </span>
            {showPct && <span className="text-muted-foreground">{kcalPct}% of target</span>}
          </div>
          {showPct && (
            <Progress value={kcalPct} barClassName={severityClass(kcalPct)} />
          )}
          {totals.meals === 0 && (
            <p className="text-xs text-muted-foreground">
              No meals recorded this day - the bars fill up as you log.
            </p>
          )}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <MacroBar label="protein" value={totals.proteinG} target={t.proteinG} unit="g" showPct={showPct} />
            <MacroBar label="fat" value={totals.fatG} target={t.fatG} unit="g" showPct={showPct} />
            <MacroBar label="carbs" value={totals.carbsG} target={t.carbsG} unit="g" showPct={showPct} />
            <MacroBar label="sugar" value={totals.sugarG} target={t.sugarG} unit="g" showPct={showPct} />
            <MacroBar label="sodium" value={totals.sodiumMg} target={t.sodiumMg} unit="mg" showPct={showPct} />
          </div>
        </CardContent>
      </Card>

      {day.meals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No meals on this day.</p>
      ) : (
        <div className="space-y-2">
          <h3 className="px-1 text-sm font-medium text-muted-foreground">
            Meals
          </h3>
          {day.meals.map((m) => (
            <MealCard
              key={m.id}
              meal={m}
              budgetKcal={data.budget.kcal}
              scientific={scientific}
              onClick={() => setSelected(m)}
            />
          ))}
        </div>
      )}

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
    </div>
  );
}

function WeeklyView({ data, showPct }: { data: StatsResponse; showPct: boolean }) {
  const { days, summary } = data;
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-2 pt-4">
          <h3 className="text-sm font-medium">Last 7 days - kcal per day</h3>
          <KcalBars days={days} scope={data.scope} />
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total kcal" value={fmtK(summary.totalKcal)} />
        <StatCard label="Avg per day" value={fmt(summary.avgKcal)} sub="days with meals" />
        <StatCard label="Meals" value={fmt(summary.mealCount)} />
        <StatCard label="Total sugar" value={`${fmt(summary.totalSugarG)} g`} />
      </div>
      {showPct && (
        <Card>
          <CardContent className="grid grid-cols-1 gap-2.5 pt-4 sm:grid-cols-2">
            <MacroBar label="protein" value={summary.totalProteinG} target={data.targets.proteinG * 7} unit="g" showPct />
            <MacroBar label="fat" value={summary.totalFatG} target={data.targets.fatG * 7} unit="g" showPct />
            <MacroBar label="carbs" value={summary.totalCarbsG} target={data.targets.carbsG * 7} unit="g" showPct />
            <MacroBar label="sodium" value={summary.totalSodiumMg} target={data.targets.sodiumMg * 7} unit="mg" showPct />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MonthlyView({ data, showPct }: { data: StatsResponse; showPct: boolean }) {
  const { days, summary } = data;
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-2 pt-4">
          <h3 className="text-sm font-medium">Last 30 days - kcal per day</h3>
          <div className="flex h-32 items-end gap-0.5">
            {days.map((d, i) => {
              const max = Math.max(...days.map((x) => x.totals.kcal), 1);
              const h = d.totals.kcal > 0 ? Math.max(3, (d.totals.kcal / max) * 100) : 0;
              const labelAt = [0, 7, 14, 21, 29].includes(i);
              return (
                <div key={d.date} className="flex h-full flex-1 flex-col justify-end">
                  <div
                    className={cn("w-full rounded-t", d.totals.kcal === 0 ? "bg-secondary" : "bg-primary")}
                    style={{ height: `${h}%` }}
                    title={`${d.date}: ${fmt(d.totals.kcal)} kcal`}
                  />
                  {labelAt && (
                    <div className="mt-0.5 text-center text-[9px] leading-3 text-muted-foreground">
                      {format(parseISO(d.date), "M/d")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total kcal" value={fmtK(summary.totalKcal)} />
        <StatCard label="Avg per day" value={fmt(summary.avgKcal)} sub="days with meals" />
        <StatCard label="Meals" value={fmt(summary.mealCount)} />
        <StatCard label="Total sugar" value={`${fmt(summary.totalSugarG)} g`} />
      </div>
      <Card>
        <CardContent className="grid grid-cols-2 gap-2.5 pt-4 sm:grid-cols-5">
          <MacroBar label="protein" value={summary.totalProteinG} target={data.targets.proteinG * 30} unit="g" showPct={showPct} />
          <MacroBar label="fat" value={summary.totalFatG} target={data.targets.fatG * 30} unit="g" showPct={showPct} />
          <MacroBar label="carbs" value={summary.totalCarbsG} target={data.targets.carbsG * 30} unit="g" showPct={showPct} />
          <MacroBar label="sugar" value={summary.totalSugarG} target={data.targets.sugarG * 30} unit="g" showPct={showPct} />
          <MacroBar label="sodium" value={summary.totalSodiumMg} target={data.targets.sodiumMg * 30} unit="mg" showPct={showPct} />
        </CardContent>
      </Card>
    </div>
  );
}
