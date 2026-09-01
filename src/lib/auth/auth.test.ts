import { createHash, randomUUID } from "node:crypto"
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { beforeEach, describe, expect, it } from "vitest"

import * as schema from "@/db/schema"
import type { AppDb } from "@/db/client"
import {
  consumeLoginToken,
  createLoginToken,
  createSession,
  getSession,
  isLoginRateLimited,
  linkSessionToFriend,
  LOGIN_RATE_LIMIT_MAX_REQUESTS,
  LOGIN_TOKEN_TTL_MS,
  revokeSession,
  SESSION_TTL_MS,
} from "@/lib/auth/store"

let db: AppDb

beforeEach(async () => {
  const client = createClient({ url: ":memory:" })
  await client.batch(
    [
      `CREATE TABLE friends (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        birth_month INTEGER NOT NULL,
        birth_day INTEGER NOT NULL,
        birth_year INTEGER,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE login_tokens (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL,
        consumed_at INTEGER,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        token_hash TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        friend_id TEXT REFERENCES friends(id),
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )`,
    ],
    "write",
  )
  db = drizzle(client, { schema })
})

describe("login tokens", () => {
  it("consumes a token exactly once", async () => {
    const now = new Date("2026-01-01T00:00:00.000Z")
    const rawToken = await createLoginToken(db, "a@example.com", now)

    const first = await consumeLoginToken(db, rawToken, now)
    expect(first).toBe("a@example.com")

    const second = await consumeLoginToken(db, rawToken, now)
    expect(second).toBeNull()
  })

  it("rejects an expired token", async () => {
    const issuedAt = new Date("2026-01-01T00:00:00.000Z")
    const rawToken = await createLoginToken(db, "a@example.com", issuedAt)

    const afterExpiry = new Date(issuedAt.getTime() + LOGIN_TOKEN_TTL_MS + 1)
    const result = await consumeLoginToken(db, rawToken, afterExpiry)
    expect(result).toBeNull()
  })

  it("rejects an unknown token", async () => {
    const result = await consumeLoginToken(db, "not-a-real-token", new Date())
    expect(result).toBeNull()
  })

  it("never stores the raw token", async () => {
    const rawToken = await createLoginToken(db, "a@example.com", new Date())
    const rows = await db.select().from(schema.loginTokens)
    expect(rows[0].tokenHash).not.toBe(rawToken)
    expect(rows[0].tokenHash).toBe(createHash("sha256").update(rawToken).digest("hex"))
  })

  it("rate-limits repeated requests for the same email within the window", async () => {
    const now = new Date("2026-01-01T00:00:00.000Z")
    for (let i = 0; i < LOGIN_RATE_LIMIT_MAX_REQUESTS; i++) {
      await createLoginToken(db, "a@example.com", now)
    }

    expect(await isLoginRateLimited(db, "a@example.com", now)).toBe(true)
    expect(await isLoginRateLimited(db, "someone-else@example.com", now)).toBe(false)
  })
})

describe("sessions", () => {
  it("creates and looks up a session", async () => {
    const now = new Date("2026-01-01T00:00:00.000Z")
    const rawToken = await createSession(db, "a@example.com", null, now)

    const session = await getSession(db, rawToken, now)
    expect(session).toMatchObject({ email: "a@example.com", friendId: null })
  })

  it("rejects an expired session", async () => {
    const issuedAt = new Date("2026-01-01T00:00:00.000Z")
    const rawToken = await createSession(db, "a@example.com", null, issuedAt)

    const afterExpiry = new Date(issuedAt.getTime() + SESSION_TTL_MS + 1)
    expect(await getSession(db, rawToken, afterExpiry)).toBeNull()
  })

  it("revokes a session on logout", async () => {
    const rawToken = await createSession(db, "a@example.com", null)
    await revokeSession(db, rawToken)
    expect(await getSession(db, rawToken)).toBeNull()
  })

  it("links a session to a friend record", async () => {
    const friendId = randomUUID()
    await db.insert(schema.friends).values({
      id: friendId,
      name: "Ana",
      email: "a@example.com",
      birthMonth: 1,
      birthDay: 1,
      createdAt: Date.now(),
    })

    const rawToken = await createSession(db, "a@example.com", null)
    const session = await getSession(db, rawToken)
    await linkSessionToFriend(db, session!.id, friendId)

    const linked = await getSession(db, rawToken)
    expect(linked?.friendId).toBe(friendId)
  })
})
