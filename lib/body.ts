/**
 * BMI helpers (pure). The BMR/TDEE calorie model lives in lib/budget.ts.
 */

export function computeBmi(
  heightCm: number | null,
  weightKg: number | null
): number | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}
