import { randomBytes, randomUUID, createHash } from "node:crypto"
import { and, eq, gt, isNull, sql } from "drizzle-orm"

import type { AppDb } from "@/db/client"
import { loginTokens, sessions } from "@/db/schema"

export const LOGIN_TOKEN_TTL_MS = 15 * 60 * 1000
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
export const LOGIN_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000
export const LOGIN_RATE_LIMIT_MAX_REQUESTS = 3

function generateOpaqueToken(): string {
  return randomBytes(32).toString("base64url")
}

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex")
}

export async function isLoginRateLimited(db: AppDb, email: string, now: Date = new Date()): Promise<boolean> {
  const windowStart = now.getTime() - LOGIN_RATE_LIMIT_WINDOW_MS

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(loginTokens)
    .where(and(eq(loginTokens.email, email), gt(loginTokens.createdAt, windowStart)))

  return count >= LOGIN_RATE_LIMIT_MAX_REQUESTS
}

export async function createLoginToken(db: AppDb, email: string, now: Date = new Date()): Promise<string> {
  const rawToken = generateOpaqueToken()

  await db.insert(loginTokens).values({
    id: randomUUID(),
    email,
    tokenHash: hashToken(rawToken),
    expiresAt: now.getTime() + LOGIN_TOKEN_TTL_MS,
    consumedAt: null,
    createdAt: now.getTime(),
  })

  return rawToken
}

export async function consumeLoginToken(db: AppDb, rawToken: string, now: Date = new Date()): Promise<string | null> {
  const tokenHash = hashToken(rawToken)

  const consumed = await db
    .update(loginTokens)
    .set({ consumedAt: now.getTime() })
    .where(
      and(
        eq(loginTokens.tokenHash, tokenHash),
        isNull(loginTokens.consumedAt),
        gt(loginTokens.expiresAt, now.getTime()),
      ),
    )
    .returning({ email: loginTokens.email })

  return consumed[0]?.email ?? null
}

interface SessionRecord {
  id: string
  email: string
  friendId: string | null
}

export async function createSession(
  db: AppDb,
  email: string,
  friendId: string | null,
  now: Date = new Date(),
): Promise<string> {
  const rawToken = generateOpaqueToken()

  await db.insert(sessions).values({
    id: randomUUID(),
    tokenHash: hashToken(rawToken),
    email,
    friendId,
    expiresAt: now.getTime() + SESSION_TTL_MS,
    createdAt: now.getTime(),
  })

  return rawToken
}

export async function getSession(db: AppDb, rawToken: string, now: Date = new Date()): Promise<SessionRecord | null> {
  const tokenHash = hashToken(rawToken)

  const rows = await db
    .select({ id: sessions.id, email: sessions.email, friendId: sessions.friendId })
    .from(sessions)
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now.getTime())))
    .limit(1)

  return rows[0] ?? null
}

export async function revokeSession(db: AppDb, rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken)
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash))
}

export async function linkSessionToFriend(db: AppDb, sessionId: string, friendId: string): Promise<void> {
  await db.update(sessions).set({ friendId }).where(eq(sessions.id, sessionId))
}
