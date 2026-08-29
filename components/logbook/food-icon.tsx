import {
  Apple,
  Banana,
  Beef,
  Cake,
  Carrot,
  Citrus,
  Coffee,
  Cookie,
  Croissant,
  CupSoda,
  Donut,
  Drumstick,
  Egg,
  Fish,
  IceCreamCone,
  Milk,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
  Wheat,
  type LucideIcon,
} from "lucide-react";

/**
 * Pick a food icon for a meal from its name/description keywords.
 * First matching rule wins - order matters (specific before generic).
 */
const RULES: Array<{ words: string[]; icon: LucideIcon }> = [
  { words: ["pizza"], icon: Pizza },
  { words: ["sandwich", "burger", "wrap", "toast", "bagel"], icon: Sandwich },
  { words: ["soup", "ramen", "broth", "stew"], icon: Soup },
  { words: ["salad", "lettuce", "greens", "veggie bowl"], icon: Salad },
  { words: ["pasta", "spaghetti", "noodle", "wheat", "bread", "grain", "rice"], icon: Wheat },
  { words: ["croissant", "pastry"], icon: Croissant },
  { words: ["coffee", "latte", "cappuccino", "espresso", "tea"], icon: Coffee },
  { words: ["smoothie", "shake", "soda", "cola", "juice", "drink", "beer", "wine"], icon: CupSoda },
  { words: ["egg", "omelet", "omelette", "scramble"], icon: Egg },
  { words: ["chicken", "turkey", "drumstick"], icon: Drumstick },
  { words: ["fish", "salmon", "tuna", "cod", "shrimp", "prawn"], icon: Fish },
  { words: ["steak", "beef", "pork", "meat", "lamb"], icon: Beef },
  { words: ["apple"], icon: Apple },
  { words: ["banana"], icon: Banana },
  { words: ["orange", "citrus", "lemon", "grapefruit"], icon: Citrus },
  { words: ["carrot", "broccoli", "vegetable", "veggie", "spinach"], icon: Carrot },
  { words: ["cake", "brownie"], icon: Cake },
  { words: ["cookie", "biscuit"], icon: Cookie },
  { words: ["donut", "doughnut"], icon: Donut },
  { words: ["ice cream", "gelato", "frozen yogurt"], icon: IceCreamCone },
  { words: ["milk", "yogurt", "cheese", "dairy"], icon: Milk },
];

export function mealIcon(text: string): LucideIcon {
  const t = text.toLowerCase();
  for (const rule of RULES) {
    if (rule.words.some((w) => t.includes(w))) return rule.icon;
  }
  return UtensilsCrossed;
}
