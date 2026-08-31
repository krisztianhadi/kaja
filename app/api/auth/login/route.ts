import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { ensureUsers } from "@/lib/auth/seed-users";
import { loginSchema } from "@/lib/validators";
import { jsonError, userDto } from "@/lib/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
export const dynamic = "force-dynamic";


export async function POST(request: Request) {
  const rl = rateLimit(clientIp(request));
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSeconds) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid request body");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Username and password are required");
  }

  await ensureUsers();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, parsed.data.username.trim()))
    .limit(1);

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return jsonError(401, "Invalid username or password");
  }

  await setSessionCookie(user.id);
  return NextResponse.json({ user: userDto(user) });
}
