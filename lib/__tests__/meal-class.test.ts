import { describe, expect, it } from "vitest";
import { classifyMeal } from "@/lib/meal-class";

const light = { kcal: 300, proteinG: 10, fatG: 8, carbsG: 40, sugarG: 5, sodiumMg: 400 };
const junkNums = { kcal: 600, proteinG: 5, fatG: 25, carbsG: 70, sugarG: 30, sodiumMg: 1200 };
const heavyNums = { kcal: 800, proteinG: 40, fatG: 40, carbsG: 60, sugarG: 10, sodiumMg: 700 };

describe("classifyMeal", () => {
  it("marks known junk by name as trashfood", () => {
    expect(classifyMeal("mcdonald big mac meal", light)).toBe("trashfood");
    expect(classifyMeal("a slice of chocolate cake", light)).toBe("trashfood");
  });

  it("matches junk words whole-word only (cake != pancakes)", () => {
    expect(classifyMeal("pancakes with syrup", light)).not.toBe("trashfood");
    expect(classifyMeal("birthday cake", light)).toBe("trashfood");
  });

  it("never flags thai kitchen dishes as trashfood", () => {
    expect(classifyMeal("som tum with papaya", junkNums)).not.toBe("trashfood");
    expect(classifyMeal("pad ka pao moo", junkNums)).not.toBe("trashfood");
  });

  it("still marks a huge thai dish as heavy", () => {
    expect(classifyMeal("som tum", heavyNums)).toBe("heavy");
  });

  it("health foods skip the keyword check - numbers decide", () => {
    expect(classifyMeal("green smoothie", light)).not.toBe("trashfood");
    expect(classifyMeal("greek yogurt bowl", light)).not.toBe("trashfood");
  });

  it("numeric junk signature is high sugar AND high sodium", () => {
    expect(classifyMeal("random salty snack", junkNums)).toBe("trashfood");
    // only high sugar, no sodium - not trashfood (e.g. a sweet fruit)
    expect(classifyMeal("sweet mango", { ...light, sugarG: 30, sodiumMg: 5 })).not.toBe("trashfood");
  });

  it("classifies heavy and light by numbers", () => {
    expect(classifyMeal("grilled steak with rice", heavyNums)).toBe("heavy");
    expect(classifyMeal("light salad", light)).toBe("light");
  });
});
