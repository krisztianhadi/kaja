import { NextResponse } from "next/server";
import { requireUser, userDto } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ user: userDto(user) });
  } catch (err) {
    if (err instanceof NextResponse) return err;
    throw err;
  }
}
