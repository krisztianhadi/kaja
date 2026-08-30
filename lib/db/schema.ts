import {
  pgTable,
  text,
  uuid,
  timestamp,
  jsonb,
  doublePrecision,
  integer,
  boolean,
  primaryKey,
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
  // protein/fat/carbs/sugar/sodium stay manual; kcal comes from the BMR/TDEE
  // model unless manually overridden
  // manual calorie override; null = automatic BMR/TDEE budget.
  // physical column name kept as target_kcal (avoided a rename conflict)
  manualKcal: integer("target_kcal"),
  targetProteinG: integer("target_protein_g").notNull().default(50),
  targetFatG: integer("target_fat_g").notNull().default(70),
  targetCarbsG: integer("target_carbs_g").notNull().default(250),
  targetSugarG: integer("target_sugar_g").notNull().default(25),
  targetSodiumMg: integer("target_sodium_mg").notNull().default(2300),
  // body data for BMR/TDEE (optional until filled in)
  heightCm: integer("height_cm"),
  weightKg: doublePrecision("weight_kg"),
  age: integer("age"),
  gender: text("gender"), // male | female
  activity: text("activity").notNull().default("sedentary"), // sedentary|light|moderate|active|extra
  goal: text("goal").notNull().default("maintain"), // maintain|lose|gain
  // where the user lives - the AI suggests locally available dishes
  region: text("region"),
  // environment: hot climates raise sodium needs (sweat losses)
  climate: text("climate").notNull().default("temperate"), // hot|temperate
  // exact numbers (g/kcal/mg) on the main screen; false = percentages only
  scientific: boolean("scientific").notNull().default(false),
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
  // model that produced this estimate (null for imported/demo data)
  model: text("model"),
  // { level, name, message, aiExtra, aiConfirmed }
  suggestion: jsonb("suggestion").$type<Suggestion | null>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Meal = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;

/** Per-day activity override ("more/less active than usual"). */
export const dayOverrides = pgTable(
  "day_overrides",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dayKey: text("day_key").notNull(), // YYYY-MM-DD in the client's tz
    mode: text("mode").notNull(), // usual|more|less
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ name: "day_overrides_pk", columns: [t.userId, t.dayKey] }),
  ]
);

export type DayOverride = typeof dayOverrides.$inferSelect;

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
