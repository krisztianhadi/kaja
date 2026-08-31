import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireUser } from "@/lib/server";
export const dynamic = "force-dynamic";


export async function GET() {
  try {
    await requireUser();
    const family = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .orderBy(users.username);
    return NextResponse.json({ users: family });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    throw err;
  }
}
