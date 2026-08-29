import { cookies } from "next/headers";
import { createSessionToken, SESSION_COOKIE, verifySessionToken } from "./token";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** Current session user id from the cookie, or null. */
export async function getSessionUserId(): Promise<string | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(userId: string): Promise<void> {
  const token = await createSessionToken(userId);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  cookies().delete(SESSION_COOKIE);
}
