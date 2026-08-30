import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireUser, userDto, jsonError } from "@/lib/server";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { settingsSchema } from "@/lib/validators";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ user: userDto(user) });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    throw err;
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError(400, "Invalid request body");
    }

    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "Invalid settings values");
    }
    const d = parsed.data;

    const update: Record<string, unknown> = {};

    if (d.password) {
      const currentPassword = String(
        (body as Record<string, unknown>).currentPassword ?? ""
      );
      if (!(await verifyPassword(currentPassword, user.passwordHash))) {
        return jsonError(401, "Current password is wrong");
      }
      update.passwordHash = await hashPassword(d.password);
    }

    if (d.geminiApiKey !== undefined) {
      const key = (d.geminiApiKey ?? "").trim();
      update.geminiApiKey = key === "" ? null : key;
    }
    if (d.heightCm !== undefined) {
      update.heightCm = d.heightCm; // null clears it
    }
    if (d.weightKg !== undefined) {
      update.weightKg = d.weightKg;
    }
    if (d.age !== undefined) {
      update.age = d.age; // null clears it
    }
    if (d.gender !== undefined) {
      update.gender = d.gender; // null clears it
    }
    if (d.activity !== undefined) {
      update.activity = d.activity;
    }
    if (d.goal !== undefined) {
      update.goal = d.goal;
    }
    if (d.manualKcal !== undefined) {
      update.manualKcal = d.manualKcal; // null = automatic budget
    }
    if (d.region !== undefined) {
      update.region = d.region === "" ? null : d.region; // "" clears it
    }
    if (d.scientific !== undefined) {
      update.scientific = d.scientific;
    }
    if (d.bio !== undefined) update.bio = d.bio;
    if (d.goals !== undefined) update.goals = d.goals;
    if (d.diet !== undefined) update.diet = d.diet;
    if (d.targetProteinG !== undefined) update.targetProteinG = d.targetProteinG;
    if (d.targetFatG !== undefined) update.targetFatG = d.targetFatG;
    if (d.targetCarbsG !== undefined) update.targetCarbsG = d.targetCarbsG;
    if (d.targetSugarG !== undefined) update.targetSugarG = d.targetSugarG;
    if (d.targetSodiumMg !== undefined) update.targetSodiumMg = d.targetSodiumMg;

    if (Object.keys(update).length > 0) {
      await db.update(users).set(update).where(eq(users.id, user.id));
    }

    const [fresh] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    return NextResponse.json({ user: userDto(fresh) });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    throw err;
  }
}
