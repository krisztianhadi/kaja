import { describe, expect, it } from "vitest";
import { computeBmr, computeBudget, type BudgetInput } from "@/lib/budget";

const base: BudgetInput = {
  weightKg: 72.5,
  heightCm: 175,
  age: 40,
  gender: "male",
  activity: "light",
  goal: "maintain",
  manualKcal: null,
  overrideMode: "usual",
};

describe("computeBmr", () => {
  it("computes Mifflin-St Jeor for men", () => {
    // 10*72.5 + 6.25*175 - 5*40 + 5 = 1623.75
    expect(computeBmr(72.5, 175, 40, "male")).toBeCloseTo(1623.75, 1);
  });

  it("computes for women", () => {
    // 10*60 + 6.25*165 - 5*30 - 161 = 1320.25
    expect(computeBmr(60, 165, 30, "female")).toBeCloseTo(1320.25, 1);
  });

  it("returns null when profile is incomplete", () => {
    expect(computeBmr(null, 175, 40, "male")).toBeNull();
    expect(computeBmr(72.5, 175, null, "male")).toBeNull();
  });
});

describe("computeBudget", () => {
  it("computes TDEE x multiplier + goal adjustment", () => {
    // BMR 1623.75 x 1.375 light - 400 lose = 1832.7 -> 1833
    const b = computeBudget({ ...base, goal: "lose" });
    expect(b.complete).toBe(true);
    expect(b.kcal).toBe(1833);
    expect(b.auto).toBe(true);
  });

  it("applies the daily override on top", () => {
    const b = computeBudget({ ...base, goal: "lose", overrideMode: "more" });
    expect(b.kcal).toBe(1833 + 250);
  });

  it("manual kcal wins and marks auto=false", () => {
    const b = computeBudget({ ...base, manualKcal: 2500 });
    expect(b.kcal).toBe(2500);
    expect(b.auto).toBe(false);
    expect(b.complete).toBe(true);
  });

  it("falls back to 2000 kcal when profile is incomplete", () => {
    const b = computeBudget({ ...base, age: null });
    expect(b.kcal).toBe(2000);
    expect(b.complete).toBe(false);
  });
});
