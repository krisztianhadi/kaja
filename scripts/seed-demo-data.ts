/**
 * Seed demo meals for the configured users so the logbook and dashboards
 * have something to look at during development.
 *
 * Inserts a fresh set of meals spread over the last 14 days for every user.
 * Run with: pnpm db:seed-data
 */
import "dotenv/config";
import { db, sql } from "../lib/db";
import { meals, users } from "../lib/db/schema";

// meal name, description, kcal, protein g, fat g, carbs g, sugar g, sodium mg
type Demo = [string, string, number, number, number, number, number, number];

const DEMO_MEALS: Demo[] = [
  ["Oatmeal with berries", "oats, milk, blueberries, honey", 320, 12, 8, 52, 14, 180],
  ["Eggs and avocado toast", "two eggs, sourdough, avocado", 410, 19, 24, 28, 4, 520],
  ["Greek yogurt bowl", "yogurt, granola, banana", 340, 18, 9, 46, 22, 110],
  ["Chicken and rice bowl", "grilled chicken, white rice, veggies", 540, 40, 14, 55, 4, 640],
  ["Tomato pasta", "penne, tomato sauce, parmesan", 460, 16, 14, 68, 12, 720],
  ["Caesar salad", "romaine, chicken, croutons, dressing", 390, 28, 24, 16, 3, 810],
  ["Beef stir-fry", "beef strips, peppers, noodles", 520, 32, 22, 48, 9, 980],
  ["Salmon and broccoli", "baked salmon, steamed broccoli, rice", 470, 36, 22, 32, 3, 540],
  ["Margherita pizza", "tomato, mozzarella, basil", 780, 32, 28, 88, 9, 1400],
  ["Burger and fries", "beef burger, cheddar, fries", 890, 34, 48, 76, 8, 1500],
  ["Miso soup and dumplings", "miso, tofu, veggie dumplings", 380, 16, 12, 48, 6, 1200],
  ["Fruit smoothie", "banana, mango, spinach, oat milk", 260, 6, 3, 52, 34, 60],
  ["Cheese sandwich", "toasted cheese, tomato, white bread", 410, 16, 20, 42, 6, 980],
  ["Chocolate protein shake", "whey, cocoa, milk, banana", 300, 30, 7, 30, 18, 180],
  ["Veggie curry", "chickpeas, coconut milk, rice", 520, 18, 22, 62, 12, 880],
  ["Ham and cheese croissant", "croissant, ham, emmental", 450, 18, 26, 36, 5, 1100],
  ["Tuna poke bowl", "tuna, rice, edamame, sesame", 480, 34, 16, 52, 8, 760],
  ["Cappuccino and cookie", "cappuccino, oat cookie", 260, 7, 10, 34, 16, 120],
  ["Lentil soup", "lentils, carrot, celery, bread", 350, 18, 6, 52, 6, 890],
  ["Pancakes with maple", "pancakes, butter, maple syrup", 620, 12, 22, 92, 38, 520],
];

const MS_DAY = 86_400_000;

async function main() {
  const allUsers = await db.select({ id: users.id, username: users.username }).from(users);
  if (allUsers.length === 0) {
    console.error("No users found - run pnpm db:seed first");
    process.exit(1);
  }

  let inserted = 0;
  const now = Date.now();
  for (const user of allUsers) {
    for (let day = 13; day >= 0; day--) {
      // 2-4 meals per day at plausible hours
      const count = 2 + ((day * 7) % 3);
      for (let i = 0; i < count; i++) {
        const [name, desc, kcal, p, f, c, s, sodium] =
          DEMO_MEALS[(day * 5 + i * 3) % DEMO_MEALS.length];
        const hour = 8 + i * 5 + (day % 2); // ~8:00, 13:00, 18:00
        const createdAt = new Date(now - day * MS_DAY - (23 - hour) * 3_600_000);
        await db.insert(meals).values({
          authorId: user.id,
          participantIds: [],
          description: desc,
          kcal,
          proteinG: p,
          fatG: f,
          carbsG: c,
          sugarG: s,
          sodiumMg: sodium,
          mealName: name,
          portion: "one serving",
          confidence: (["high", "medium"] as const)[day % 2],
          source: "ai",
          createdAt,
        });
        inserted++;
      }
    }
  }
  console.log(`Seeded ${inserted} demo meals across ${allUsers.length} user(s)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });
