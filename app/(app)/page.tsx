"use client";

import { ForgotBanner } from "@/components/logbook/forgot-banner";
import { MealForm } from "@/components/logbook/meal-form";
import { MealStack } from "@/components/logbook/meal-stack";
import { TodayStrip } from "@/components/logbook/today-strip";

export default function LogbookPage() {
  return (
    <div className="space-y-4">
      <ForgotBanner />
      <MealForm onRecorded={() => {}} />
      <TodayStrip />
      <div>
        <h2 className="mb-2 px-1 text-sm font-medium text-muted-foreground">
          Previous meals
        </h2>
        <MealStack onRecorded={() => {}} />
      </div>
    </div>
  );
}
