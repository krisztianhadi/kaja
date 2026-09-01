import { z } from "zod";

/**
 * Default Gemini model. gemini-2.5-flash is deprecated for new API keys
 * (404 "no longer available to new users") - use the current flash line.
 */
export const DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview";

/**
 * Stronger model used when the user asks to re-analyze a low/medium
 * confidence estimate. gemini-3.1-pro-preview is quota-blocked on the
 * free tier (429), so the best available flash is the escalation target.
 */
export const DEFAULT_BETTER_GEMINI_MODEL = "gemini-3.6-flash";

export interface Nutrition {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  sugarG: number;
  sodiumMg: number;
}

export const nutritionSchema = z.object({
  mealName: z.string().default(""),
  portion: z.string().default(""),
  isFood: z.boolean().default(true),
  nutrition: z.object({
    kcal: z.number(),
    proteinG: z.number(),
    fatG: z.number(),
    carbsG: z.number(),
    sugarG: z.number(),
    sodiumMg: z.number(),
  }),
  confidence: z.enum(["high", "medium", "low"]).default("low"),
  suggestion: z
    .object({
      confirmsRule: z.boolean().default(true),
      extra: z.string().nullable().default(null),
    })
    .default({ confirmsRule: true, extra: null }),
});

export type AiEstimate = z.infer<typeof nutritionSchema>;

export interface AnalyzeInput {
  description: string;
  /** base64 data URI of a downscaled photo, or null */
  imageDataUri: string | null;
  apiKey: string;
  model: string;
  userContext: string;
  dayTotalsText: string;
  ruleSuggestionText: string;
  /** true when this is a re-analysis of an existing estimate */
  reanalysis?: boolean;
  /** user's region (e.g. "thailand") - suggest locally available dishes */
  location?: string;
}

function buildPrompt(input: AnalyzeInput): string {
  const desc = input.description.trim() || "(no text - photo only)";
  return [
    "You are a practical nutrition estimator for a personal food logbook.",
    "You are given a food description and/or a photo of a meal.",
    "Estimate a SINGLE typical serving using standard food-reference values (USDA-style).",
    "Be honest about uncertainty: if the input is vague or the photo is ambiguous, state your assumption in \"portion\" (e.g. \"one slice, ~120g\") and set confidence to \"low\".",
    "",
    "User context (adjust the estimate if relevant):",
    input.userContext,
    "",
    "So far today this user has consumed:",
    input.dayTotalsText,
    "",
    `A local rule check produced this suggestion: "${input.ruleSuggestionText}"`,
    "If the rule suggestion is reasonable for this user, set suggestion.confirmsRule to true.",
    "If a different or additional counter action would be more useful (considering the user's context), set confirmsRule to false and/or fill suggestion.extra with ONE short actionable suggestion.",
    "The user's day may ALREADY be over a target (sugar, sodium, calories). When it is, do NOT recommend another dish or more food - the counter action is to stop, go light, or hydrate. Only suggest a specific food or dish when the day still has room in its targets.",
    "The meal being estimated is ALREADY LOGGED - it is a post-meal record. Never tell the user to avoid or not eat this meal; phrase the counter action for the REST of the day.",
    input.location
      ? `The user is in ${input.location}. When suggesting a counter-action meal, recommend a specific dish that is commonly available and familiar there (e.g. local street food or home cooking), not generic advice like "more lean protein".`
      : "",
    "",
    `Food to estimate: ${desc}`,
    "",
    "If the item is NOT food (e.g. a concrete brick, plastic, electronics, a rock, a phone), set isFood to false, name what it actually is in mealName, and set all nutrition values to 0.",
    "",
    input.reanalysis
      ? "This is a RE-ANALYSIS to improve a previous estimate. Be more careful and precise: state exactly what you are assuming and give the most plausible single estimate."
      : "",
    "",
    "Respond ONLY with JSON in this exact shape:",
    '{ "mealName": string, "portion": string, "isFood": boolean, "nutrition": { "kcal": number, "proteinG": number, "fatG": number, "carbsG": number, "sugarG": number, "sodiumMg": number }, "confidence": "high"|"medium"|"low", "suggestion": { "confirmsRule": boolean, "extra": string|null } }',
  ].join("\n");
}

function splitDataUri(dataUri: string): { mime: string; data: string } {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(dataUri);
  if (!m) throw new Error("Invalid image data URI");
  return { mime: m[1], data: m[2] };
}

function parseAiJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Gemini response did not contain JSON: ${text.slice(0, 300)}`);
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    mealName: { type: "string" },
    portion: { type: "string" },
    isFood: { type: "boolean" },
    nutrition: {
      type: "object",
      properties: {
        kcal: { type: "number" },
        proteinG: { type: "number" },
        fatG: { type: "number" },
        carbsG: { type: "number" },
        sugarG: { type: "number" },
        sodiumMg: { type: "number" },
      },
      required: ["kcal", "proteinG", "fatG", "carbsG", "sugarG", "sodiumMg"],
    },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    suggestion: {
      type: "object",
      properties: {
        confirmsRule: { type: "boolean" },
        extra: { type: "string" },
      },
      required: ["confirmsRule", "extra"],
    },
  },
  required: ["mealName", "portion", "isFood", "nutrition", "confidence", "suggestion"],
};

/**
 * OpenRouter fallback model used when Gemini is unavailable (quota/429,
 * 5xx, network). Uses the SAME Gemini model via OpenRouter so behavior
 * matches the direct call (fast, vision-capable, reliable JSON).
 * Alternatives that work: deepseek/deepseek-v4-flash-vision-exp
 * (vision + JSON, but ~25s per call).
 */
export const OPENROUTER_FALLBACK_MODEL = "google/gemini-3-flash-preview";

export interface AnalysisResult {
  estimate: AiEstimate;
  /** the model that actually produced the estimate (may differ from the requested one after a fallback) */
  model: string;
  provider: "gemini" | "openrouter";
}

/**
 * User-safe reason for an analysis failure. Classified from the upstream
 * error so the app can be transparent about WHY it failed (quota, key,
 * timeout) without leaking the raw upstream body to the client.
 */
export type AnalysisFailure =
  | "quota"
  | "invalid-key"
  | "rate-limited"
  | "timeout"
  | "network"
  | "empty"
  | "unknown";

export function classifyAnalysisFailure(err: unknown): AnalysisFailure {
  const msg = err instanceof Error ? err.message : String(err);
  const low = msg.toLowerCase();
  // explicit quota exhaustion (Gemini 429 usually says RESOURCE_EXHAUSTED /
  // "quota exceeded"; OpenRouter says "Rate limit" for 429 - treat bare 429
  // as rate-limited, quota only when named)
  if (/(quota|resource exhausted|insufficient)/.test(low)) return "quota";
  if (/(429|rate limit|too many requests)/.test(low)) return "rate-limited";
  if (/(401|403|api key|permission|unauthorized|invalid key)/.test(low)) return "invalid-key";
  if (/(timeout|abort|timed out)/.test(low)) return "timeout";
  if (/(fetch failed|network|enotfound|econnrefused|getaddrinfo)/.test(low)) return "network";
  if (/(no content|empty response|blockreason)/.test(low)) return "empty";
  return "unknown";
}

/** Friendly copy shown to the user for each failure reason. */
export function analysisFailureMessage(failure: AnalysisFailure): string {
  switch (failure) {
    case "quota":
      return "The AI quota for the free tier is used up right now - try again later, or add your own Gemini API key in Settings.";
    case "invalid-key":
      return "The Gemini API key looks invalid - check it in Settings.";
    case "rate-limited":
      return "The AI service is rate-limiting requests right now - wait a minute and try again.";
    case "timeout":
      return "The AI service took too long to answer - try again.";
    case "network":
      return "Could not reach the AI service - check your connection and try again.";
    case "empty":
      return "The AI returned no useful answer - try again.";
    default:
      return "Could not analyze the meal - please try again.";
  }
}

/**
 * Estimate a meal's nutrition. Primary: Gemini. If Gemini fails (quota,
 * outage, ...) and OPENROUTER_TOKEN is set, falls back to OpenRouter so the
 * logbook keeps working. The model actually used is returned and recorded
 * on the meal.
 */
export async function analyzeMeal(input: AnalyzeInput): Promise<AnalysisResult> {
  try {
    const estimate = await analyzeWithGemini(input);
    return { estimate, model: input.model, provider: "gemini" };
  } catch (err) {
    const fallbackKey = process.env.OPENROUTER_TOKEN;
    if (fallbackKey) {
      try {
        const estimate = await analyzeWithOpenRouter(input, fallbackKey);
        return {
          estimate,
          model: process.env.OPENROUTER_MODEL || OPENROUTER_FALLBACK_MODEL,
          provider: "openrouter",
        };
      } catch {
        // keep the original Gemini error - it is the more relevant one
      }
    }
    throw err;
  }
}

async function analyzeWithGemini(input: AnalyzeInput): Promise<AiEstimate> {
  const parts: Array<Record<string, unknown>> = [{ text: buildPrompt(input) }];
  if (input.imageDataUri) {
    const { mime, data } = splitDataUri(input.imageDataUri);
    parts.push({ inline_data: { mime_type: mime, data } });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    input.model
  )}:generateContent`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": input.apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.4,
          // thinking models burn output tokens before the answer - keep the
          // cap high enough that the JSON is never truncated mid-answer
          maxOutputTokens: 4096,
        },
      }),
      signal: AbortSignal.timeout(45000),
    });
  } catch (err) {
    throw new Error(`Gemini request failed: ${(err as Error).message}`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  const text =
    json?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? "";

  if (!text) {
    const reason = json?.promptFeedback?.blockReason ?? "empty response";
    throw new Error(`Gemini returned no content (${reason})`);
  }

  const parsed = parseAiJson(text);
  return nutritionSchema.parse(parsed);
}

async function analyzeWithOpenRouter(
  input: AnalyzeInput,
  apiKey: string
): Promise<AiEstimate> {
  const content: Array<Record<string, unknown>> = [
    { type: "text", text: buildPrompt(input) },
  ];
  if (input.imageDataUri) {
    content.push({
      type: "image_url",
      image_url: { url: input.imageDataUri },
    });
  }

  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || OPENROUTER_FALLBACK_MODEL,
        messages: [{ role: "user", content }],
        response_format: { type: "json_object" },
        max_tokens: 1024,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(45000),
    });
  } catch (err) {
    throw new Error(`OpenRouter request failed: ${(err as Error).message}`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenRouter API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content ?? "";
  if (!text) {
    throw new Error("OpenRouter returned no content");
  }

  const parsed = parseAiJson(text);
  return nutritionSchema.parse(parsed);
}
