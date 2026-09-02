import type { AstroCookies } from "astro"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/db/client", async () => {
  const { createClient } = await import("@libsql/client")
  const { drizzle } = await import("drizzle-orm/libsql")
  const schema = await import("@/db/schema")

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

  return { db: drizzle(client, { schema }) }
})

const { db } = await import("@/db/client")
const schema = await import("@/db/schema")
const { createSession } = await import("@/lib/auth/store")
const { SESSION_COOKIE_NAME } = await import("@/lib/auth/session")
const { POST: registerPOST } = await import("@/pages/api/register")

class FakeCookies {
  private store = new Map<string, string>()

  get(name: string) {
    const value = this.store.get(name)
    return value === undefined ? undefined : { value }
  }

  set(name: string, value: string) {
    this.store.set(name, value)
  }

  delete(name: string) {
    this.store.delete(name)
  }
}

function registerRequest(body: unknown) {
  return new Request("http://localhost/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = { name: "Ana García", birthMonth: 5, birthDay: 20, website: "" }

beforeEach(async () => {
  await db.delete(schema.sessions)
  await db.delete(schema.loginTokens)
  await db.delete(schema.friends)
})

describe("POST /api/register", () => {
  it("returns Spanish errors grouped by field", async () => {
    const rawToken = await createSession(db, "new@example.com", null)
    const cookies = new FakeCookies()
    cookies.set(SESSION_COOKIE_NAME, rawToken)

    const res = await registerPOST({
      request: registerRequest({ name: "", birthMonth: 13, birthDay: 0, website: "" }),
      cookies: cookies as unknown as AstroCookies,
    } as never)

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: "Revisa los datos marcados.",
      errors: {
        name: ["Ingresa tu nombre."],
        birthDay: ["El día debe estar entre 1 y 31."],
        birthMonth: ["El mes debe estar entre 1 y 12."],
      },
    })
  })

  it("rejects a day that does not exist in the selected month", async () => {
    const rawToken = await createSession(db, "new@example.com", null)
    const cookies = new FakeCookies()
    cookies.set(SESSION_COOKIE_NAME, rawToken)

    const res = await registerPOST({
      request: registerRequest({ name: "Ana", birthMonth: 2, birthDay: 31, website: "" }),
      cookies: cookies as unknown as AstroCookies,
    } as never)

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ errors: { birthDay: ["Febrero no tiene 31 días."] } })
  })

  it("rejects February 29 for a non-leap birth year", async () => {
    const rawToken = await createSession(db, "new@example.com", null)
    const cookies = new FakeCookies()
    cookies.set(SESSION_COOKIE_NAME, rawToken)

    const res = await registerPOST({
      request: registerRequest({ name: "Ana", birthMonth: 2, birthDay: 29, birthYear: 1999, website: "" }),
      cookies: cookies as unknown as AstroCookies,
    } as never)

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ errors: { birthDay: ["Febrero no tiene 29 días en 1999."] } })
  })

  it("rejects a request with no session", async () => {
    const cookies = new FakeCookies()
    const res = await registerPOST({
      request: registerRequest(VALID_BODY),
      cookies: cookies as unknown as AstroCookies,
    } as never)

    expect(res.status).toBe(401)
  })

  it("rejects a duplicate registration for an already-registered email", async () => {
    await db.insert(schema.friends).values({
      id: "friend-existing",
      name: "Ana García",
      email: "ana@example.com",
      birthMonth: 5,
      birthDay: 20,
      createdAt: Date.now(),
    })

    const rawToken = await createSession(db, "ana@example.com", "friend-existing")
    const cookies = new FakeCookies()
    cookies.set(SESSION_COOKIE_NAME, rawToken)

    const res = await registerPOST({
      request: registerRequest(VALID_BODY),
      cookies: cookies as unknown as AstroCookies,
    } as never)

    expect(res.status).toBe(409)
  })

  it("registers a new friend for a verified session and links the session", async () => {
    const rawToken = await createSession(db, "new@example.com", null)
    const cookies = new FakeCookies()
    cookies.set(SESSION_COOKIE_NAME, rawToken)

    const res = await registerPOST({
      request: registerRequest(VALID_BODY),
      cookies: cookies as unknown as AstroCookies,
    } as never)

    expect(res.status).toBe(200)

    const [friend] = await db.select().from(schema.friends)
    expect(friend.email).toBe("new@example.com")

    const [session] = await db.select().from(schema.sessions)
    expect(session.friendId).toBe(friend.id)
  })
})
