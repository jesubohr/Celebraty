import type { AstroCookies } from "astro"

import type { AppDb } from "@/db/client"
import {
  createSession as createSessionRecord,
  getSession as getSessionRecord,
  revokeSession as revokeSessionRecord,
  SESSION_TTL_MS,
} from "@/lib/auth/store"

export const SESSION_COOKIE_NAME = "celebraty_session"

function cookieOptions() {
  return {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  }
}

export async function establishSession(
  db: AppDb,
  cookies: AstroCookies,
  email: string,
  friendId: string | null,
): Promise<void> {
  const rawToken = await createSessionRecord(db, email, friendId)
  cookies.set(SESSION_COOKIE_NAME, rawToken, cookieOptions())
}

export async function getCurrentSession(db: AppDb, cookies: AstroCookies) {
  const rawToken = cookies.get(SESSION_COOKIE_NAME)?.value
  if (!rawToken) return null
  return getSessionRecord(db, rawToken)
}

export async function destroySession(db: AppDb, cookies: AstroCookies): Promise<void> {
  const rawToken = cookies.get(SESSION_COOKIE_NAME)?.value
  if (rawToken) await revokeSessionRecord(db, rawToken)
  cookies.delete(SESSION_COOKIE_NAME, { path: "/" })
}
