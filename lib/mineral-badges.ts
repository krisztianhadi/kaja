/**
 * Mineral awareness badges for meal cards - deterministic keyword matching
 * against the meal name/description (no AI, no new estimates).
 * The app does not track micronutrients; these are just "this meal is rich
 * in X" hints for people who want the awareness without the noise.
 */

const POTASSIUM_WORDS = [
  "banana",
  "coconut",
  "avocado",
  "potato",
  "sweet potato",
  "spinach",
  "kale",
  "chard",
  "beet",
  "tomato",
  "beans",
  "lentil",
  "yogurt",
  "orange",
  "papaya",
  "melon",
  "kiwi",
  "dates",
];

const MAGNESIUM_WORDS = [
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
  "beans",
  "oats",
  "oatmeal",
  "brown rice",
  "banana",
];

export interface MineralBadges {
  potassium: boolean;
  magnesium: boolean;
}

export function mineralBadges(text: string): MineralBadges {
  const t = text.toLowerCase();
  return {
    potassium: POTASSIUM_WORDS.some((w) => t.includes(w)),
    magnesium: MAGNESIUM_WORDS.some((w) => t.includes(w)),
  };
}
