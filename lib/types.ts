import type { Nutrition, Suggestion } from "@/lib/db/schema";
import type { Targets, Totals } from "./nutrition";

/** Meal as returned by the API (dates as ISO strings). */
export interface MealDto {
  id: string;
  authorId: string;
  participantIds: string[];
  description: string;
  imageData: string; // base64 data URI, "" = none
  mealName: string;
  portion: string;
  confidence: string;
  source: string;
  model: string | null;
  nutrition: Nutrition;
  suggestion: Suggestion | null;
  createdAt: string;
}

export interface DayEntry {
  date: string; // YYYY-MM-DD (server-local)
  totals: Totals;
  meals: MealDto[];
}

export interface StatsResponse {
  range: "daily" | "weekly" | "monthly";
  scope: "me" | "family";
  date: string; // YYYY-MM-DD anchor
  targets: Targets;
  days: DayEntry[];
  summary: {
    totalKcal: number;
    avgKcal: number;
    mealCount: number;
    totalProteinG: number;
    totalFatG: number;
    totalCarbsG: number;
    totalSugarG: number;
    totalSodiumMg: number;
  };
}
