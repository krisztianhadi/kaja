/**
 * Food-quality labels for meal cards - deterministic keyword matching
 * against the meal name/description (no AI, no new estimates).
 * Human-friendly awareness labels ("excellent protein source",
 * "potassium rich", ...) instead of raw micronutrient tracking.
 */

interface LabelRule {
  label: string;
  words: string[];
}

// ordered by usefulness - the first matches win when capping the pills
const RULES: LabelRule[] = [
  {
    label: "excellent protein source",
    words: [
      "egg",
      "omelet",
      "chicken",
      "turkey",
      "beef",
      "pork",
      "fish",
      "salmon",
      "tuna",
      "shrimp",
      "prawn",
      "tofu",
      "tempeh",
      "lentil",
      "beans",
      "chickpea",
      "greek yogurt",
      "cottage cheese",
      "protein shake",
      "whey",
    ],
  },
  {
    label: "high in fiber",
    words: [
      "oats",
      "oatmeal",
      "lentil",
      "beans",
      "chickpea",
      "whole grain",
      "brown rice",
      "quinoa",
      "broccoli",
      "spinach",
      "apple",
      "pear",
      "chia",
      "flax",
      "bran",
      "vegetable",
      "salad",
    ],
  },
  {
    label: "potassium rich",
    words: [
      "banana",
      "coconut",
      "avocado",
      "potato",
      "sweet potato",
      "spinach",
      "tomato",
      "beet",
      "kale",
      "chard",
      "beans",
      "lentil",
      "yogurt",
      "orange",
      "papaya",
      "melon",
      "kiwi",
      "dates",
    ],
  },
  {
    label: "vitamin C rich",
    words: [
      "orange",
      "citrus",
      "lemon",
      "lime",
      "papaya",
      "kiwi",
      "strawberry",
      "bell pepper",
      "tomato",
      "mango",
      "pineapple",
      "guava",
    ],
  },
  {
    label: "healthy fats",
    words: [
      "avocado",
      "olive oil",
      "nuts",
      "almond",
      "walnut",
      "cashew",
      "salmon",
      "mackerel",
      "sardine",
      "chia",
      "flax",
    ],
  },
  {
    label: "magnesium rich",
    words: [
      "spinach",
      "kale",
      "almond",
      "cashew",
      "peanut",
      "walnut",
      "pumpkin seed",
      "sesame",
      "chia",
      "sunflower seed",
      "dark chocolate",
      "cocoa",
      "avocado",
      "lentil",
      "oats",
      "brown rice",
      "banana",
    ],
  },
  {
    label: "iron rich",
    words: [
      "spinach",
      "red meat",
      "beef",
      "lentil",
      "beans",
      "tofu",
      "pumpkin seed",
      "dark chocolate",
      "oyster",
    ],
  },
  {
    label: "calcium rich",
    words: ["milk", "yogurt", "cheese", "greek yogurt", "tofu", "sardine", "kale", "broccoli"],
  },
];

/** Labels for a meal (capped), in rule priority order. */
export function foodLabels(text: string, max = 2): string[] {
  const t = text.toLowerCase();
  const found: string[] = [];
  for (const rule of RULES) {
    if (found.length >= max) break;
    if (rule.words.some((w) => t.includes(w))) found.push(rule.label);
  }
  return found;
}
