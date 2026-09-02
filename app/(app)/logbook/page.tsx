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
    <>
      {/* scrollable content; the record box floats over a soft scrim below */}
      <div className="space-y-4">
        <ForgotBanner />
        <TodayStrip />
        <HowIsYourDay />
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

      {/* record box pinned to the bottom: a floating card over a soft scrim */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-background/95 via-background/70 to-transparent px-4 pt-10 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="pointer-events-auto mx-auto w-full max-w-2xl">
          <MealForm
            onRecorded={() => {}}
            className="shadow-lifted"
          />
        </div>
      </div>
    </>
  );
}
