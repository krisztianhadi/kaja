import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(200),
});

export const settingsSchema = z.object({
  password: z.string().min(6).max(200).optional(),
  geminiApiKey: z.string().max(200).nullable().optional(),
  bio: z.string().max(2000).optional(),
  goals: z.string().max(2000).optional(),
  diet: z.string().max(2000).optional(),
  heightCm: z.number().int().min(50).max(300).nullable().optional(),
  weightKg: z.number().min(10).max(500).nullable().optional(),
  age: z.number().int().min(10).max(120).nullable().optional(),
  gender: z.enum(["male", "female"]).nullable().optional(),
  activity: z
    .enum(["sedentary", "light", "moderate", "active", "extra"])
    .optional(),
  goal: z.enum(["maintain", "lose", "gain"]).optional(),
  manualKcal: z.number().int().min(500).max(10000).nullable().optional(),
  region: z.string().max(40).nullable().optional(),
  climate: z.enum(["hot", "temperate"]).optional(),
  scientific: z.boolean().optional(),
  targetProteinG: z.number().int().min(0).max(2000).optional(),
  targetFatG: z.number().int().min(0).max(2000).optional(),
  targetCarbsG: z.number().int().min(0).max(2000).optional(),
  targetSugarG: z.number().int().min(0).max(1000).optional(),
  targetSodiumMg: z.number().int().min(0).max(20000).optional(),
});

export const createMealSchema = z.object({
  description: z.string().max(2000).optional(),
  participantIds: z.array(z.string().uuid()).max(20).optional(),
});

export const repeatSchema = z.object({
  mealId: z.string().uuid(),
});
