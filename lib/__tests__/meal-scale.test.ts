import { describe, expect, it } from "vitest";
import { mealScaleForUser } from "@/lib/nutrition";
import type { Meal } from "@/lib/db/schema";

const baseMeal = {
  id: "m1",
  authorId: "author",
  participantIds: null as string[] | null,
  description: "x",
  imageData: "",
  mealName: null,
  portion: null,
  confidence: "high",
  source: "ai" as const,
  model: null,
  kcal: 500,
  proteinG: 20,
  fatG: 15,
  carbsG: 60,
  sugarG: 10,
  sodiumMg: 800,
  suggestion: null,
  createdAt: new Date(),
} as unknown as Meal;

describe("mealScaleForUser", () => {
  it("personal meals count fully for the author", () => {
    const m = { ...baseMeal, participantIds: [] };
    expect(mealScaleForUser(m, "author")).toBe(1);
  });

  it("personal meals count 0 for others", () => {
    const m = { ...baseMeal, participantIds: [] };
    expect(mealScaleForUser(m, "other")).toBe(0);
  });

  it("shared meals split 1/n among participants", () => {
    const m = { ...baseMeal, participantIds: ["author", "b", "c"] };
    expect(mealScaleForUser(m, "author")).toBeCloseTo(1 / 3);
    expect(mealScaleForUser(m, "b")).toBeCloseTo(1 / 3);
  });

  it("shared meals count 0 for non-participants", () => {
    const m = { ...baseMeal, participantIds: ["author", "b"] };
    expect(mealScaleForUser(m, "stranger")).toBe(0);
  });

  it("family scope (null user) counts every meal once", () => {
    expect(mealScaleForUser(baseMeal, null)).toBe(1);
  });
});
