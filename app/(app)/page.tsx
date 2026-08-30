"use client";

import { useQuery } from "@tanstack/react-query";
import { api, tzOffsetMinutes } from "@/lib/api";
import type { StatsResponse } from "@/lib/types";
import { useUser } from "@/components/user-context";
import { ForgotBanner } from "@/components/logbook/forgot-banner";
import { MealForm } from "@/components/logbook/meal-form";
import { MealStack } from "@/components/logbook/meal-stack";
import { TodayStrip } from "@/components/logbook/today-strip";
import { HowIsYourDay } from "@/components/logbook/how-is-your-day";

export default function LogbookPage() {
  const user = useUser();

  const { data: stats } = useQuery({
    queryKey: ["stats", "daily", "me"],
    queryFn: () =>
      api<StatsResponse>(
        `/api/stats?range=daily&scope=me&tzOffsetMinutes=${tzOffsetMinutes()}`
      ),
  });

  return (
    <div className="space-y-4">
      <ForgotBanner />
      <MealForm onRecorded={() => {}} />
      <HowIsYourDay />
      <TodayStrip />
      <div>
        <h2 className="mb-2 px-1 text-sm font-medium text-muted-foreground">
          Previous meals
        </h2>
        <MealStack
          onRecorded={() => {}}
          budgetKcal={stats?.budget.kcal ?? 2000}
          scientific={user?.scientific ?? false}
        />
      </div>
    </div>
  );
}
