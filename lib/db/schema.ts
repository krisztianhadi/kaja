import {
  pgTable,
  text,
  uuid,
  timestamp,
  jsonb,
  doublePrecision,
  integer,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  // dietary notes / conditions, e.g. "diabetes, lactose intolerance"
  bio: text("bio").notNull().default(""),
  // current goals, e.g. "weight loss"
  goals: text("goals").notNull().default(""),
  // ongoing diet, e.g. "low sodium diet"
  diet: text("diet").notNull().default(""),
  // daily targets; user-overridable in Settings
  targetKcal: integer("target_kcal").notNull().default(2000),
  targetProteinG: integer("target_protein_g").notNull().default(50),
  targetFatG: integer("target_fat_g").notNull().default(70),
  targetCarbsG: integer("target_carbs_g").notNull().default(250),
  targetSugarG: integer("target_sugar_g").notNull().default(25),
  targetSodiumMg: integer("target_sodium_mg").notNull().default(2300),
  // null = use server GEMINI_TOKEN
  geminiApiKey: text("gemini_api_key"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const meals = pgTable("meals", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // user ids of everyone who shared this meal; [] or [author] = personal
  participantIds: jsonb("participant_ids").$type<string[]>().notNull().default([]),
  description: text("description").notNull().default(""),
  // small downscaled JPEG/PNG as base64 data URI ("" = no photo)
  imageData: text("image_data").notNull().default(""),
  // nutrition estimate (best effort)
  kcal: doublePrecision("kcal").notNull().default(0),
  proteinG: doublePrecision("protein_g").notNull().default(0),
  fatG: doublePrecision("fat_g").notNull().default(0),
  carbsG: doublePrecision("carbs_g").notNull().default(0),
  sugarG: doublePrecision("sugar_g").notNull().default(0),
  sodiumMg: doublePrecision("sodium_mg").notNull().default(0),
  mealName: text("meal_name").notNull().default(""),
  portion: text("portion").notNull().default(""),
  confidence: text("confidence").notNull().default("low"), // high|medium|low
  source: text("source").notNull().default("ai"), // ai | repeat
  // { level, name, message, aiExtra, aiConfirmed }
  suggestion: jsonb("suggestion").$type<Suggestion | null>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Meal = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;

export interface Suggestion {
  level: "ok" | "watch" | "high";
  name: string;
  message: string;
  aiConfirmed: boolean | null; // null = AI not consulted
  aiExtra: string | null;
}

// nutrition numbers as plain numbers (API-facing shape)
export interface Nutrition {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  sugarG: number;
  sodiumMg: number;
}
