import { z } from "zod";

/**
 * Default Gemini model. gemini-2.5-flash is deprecated for new API keys
 * (404 "no longer available to new users") - use the current flash line.
 */
export const DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview";

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
    "",
    `Food to estimate: ${desc}`,
    "",
    "Respond ONLY with JSON in this exact shape:",
    '{ "mealName": string, "portion": string, "nutrition": { "kcal": number, "proteinG": number, "fatG": number, "carbsG": number, "sugarG": number, "sodiumMg": number }, "confidence": "high"|"medium"|"low", "suggestion": { "confirmsRule": boolean, "extra": string|null } }',
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
  required: ["mealName", "portion", "nutrition", "confidence", "suggestion"],
};

export async function analyzeMeal(input: AnalyzeInput): Promise<AiEstimate> {
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
