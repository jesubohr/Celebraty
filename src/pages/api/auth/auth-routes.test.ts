import type { AstroCookies } from "astro"
import { beforeEach, describe, expect, it, vi } from "vitest"

const sendMock = vi.fn().mockResolvedValue({ data: { id: "test" }, error: null })

vi.mock("@/lib/email/resend", () => ({
  resend: { emails: { send: (...args: unknown[]) => sendMock(...args) } },
}))

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
const { createLoginToken, createSession, LOGIN_RATE_LIMIT_MAX_REQUESTS, LOGIN_TOKEN_TTL_MS } = await import(
  "@/lib/auth/store"
)
const { SESSION_COOKIE_NAME } = await import("@/lib/auth/session")
const { POST: startPOST } = await import("@/pages/api/auth/start")
const { GET: verifyGET } = await import("@/pages/api/auth/verify")
const { POST: logoutPOST } = await import("@/pages/api/auth/logout")

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

  has(name: string) {
    return this.store.has(name)
  }
}

function fakeRedirect(path: string, status = 302) {
  return new Response(null, { status, headers: { Location: path } })
}

function startRequest(email: unknown) {
  return new Request("http://localhost/api/auth/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
}

beforeEach(async () => {
  vi.stubEnv("APP_URL", "https://celebraty.test")
  vi.stubEnv("FROM_EMAIL", "Celebraty <hello@celebraty.test>")
  sendMock.mockClear()
  await db.delete(schema.sessions)
  await db.delete(schema.loginTokens)
  await db.delete(schema.friends)
})

describe("POST /api/auth/start", () => {
  it("rejects an invalid email without sending anything", async () => {
    const res = await startPOST({ request: startRequest("not-an-email") } as never)
    expect(res.status).toBe(400)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it("returns the same generic response for unregistered and registered emails", async () => {
    await db.insert(schema.friends).values({
      id: "friend-1",
      name: "Ana García",
      email: "registered@example.com",
      birthMonth: 1,
      birthDay: 1,
      createdAt: Date.now(),
    })

    const unregistered = await startPOST({ request: startRequest("new@example.com") } as never)
    const registered = await startPOST({ request: startRequest("registered@example.com") } as never)

    expect(unregistered.status).toBe(200)
    expect(registered.status).toBe(200)
    expect(await unregistered.json()).toEqual(await registered.json())
  })

  it("sends a login link containing the configured application origin", async () => {
    await startPOST({ request: startRequest("new@example.com") } as never)

    expect(sendMock).toHaveBeenCalledTimes(1)
    const call = sendMock.mock.calls[0][0]
    expect(call.to).toBe("new@example.com")
    expect(call.html).toContain("https://celebraty.test/api/auth/verify?token=")
  })

  it("throttles repeated requests for the same email but still responds generically", async () => {
    for (let i = 0; i < LOGIN_RATE_LIMIT_MAX_REQUESTS + 2; i++) {
      const res = await startPOST({ request: startRequest("flood@example.com") } as never)
      expect(res.status).toBe(200)
    }

    expect(sendMock).toHaveBeenCalledTimes(LOGIN_RATE_LIMIT_MAX_REQUESTS)
  })
})

describe("GET /api/auth/verify", () => {
  it("creates a session linked to an existing friend", async () => {
    await db.insert(schema.friends).values({
      id: "friend-2",
      name: "Beto López",
      email: "beto@example.com",
      birthMonth: 2,
      birthDay: 2,
      createdAt: Date.now(),
    })

    const rawToken = await createLoginToken(db, "beto@example.com")
    const cookies = new FakeCookies()

    const res = await verifyGET({
      url: new URL(`http://localhost/api/auth/verify?token=${rawToken}`),
      cookies: cookies as unknown as AstroCookies,
      redirect: fakeRedirect,
    } as never)

    expect(res.headers.get("Location")).toBe("/")
    const sessionToken = cookies.get(SESSION_COOKIE_NAME)?.value
    expect(sessionToken).toBeTruthy()

    const [session] = await db.select().from(schema.sessions)
    expect(session.friendId).toBe("friend-2")
  })

  it("creates a session with no friend for a new email", async () => {
    const rawToken = await createLoginToken(db, "brandnew@example.com")
    const cookies = new FakeCookies()

    await verifyGET({
      url: new URL(`http://localhost/api/auth/verify?token=${rawToken}`),
      cookies: cookies as unknown as AstroCookies,
      redirect: fakeRedirect,
    } as never)

    const [session] = await db.select().from(schema.sessions)
    expect(session.friendId).toBeNull()
  })

  it("rejects a reused token and never creates a second session", async () => {
    const rawToken = await createLoginToken(db, "once@example.com")
    const cookies = new FakeCookies()
    const context = {
      url: new URL(`http://localhost/api/auth/verify?token=${rawToken}`),
      cookies: cookies as unknown as AstroCookies,
      redirect: fakeRedirect,
    }

    const first = await verifyGET(context as never)
    expect(first.headers.get("Location")).toBe("/")

    const second = await verifyGET(context as never)
    expect(second.headers.get("Location")).toBe("/?login=expired")

    const sessions = await db.select().from(schema.sessions)
    expect(sessions).toHaveLength(1)
  })

  it("rejects an expired token", async () => {
    const issuedAt = new Date(Date.now() - LOGIN_TOKEN_TTL_MS - 5000)
    const rawToken = await createLoginToken(db, "expired@example.com", issuedAt)
    const cookies = new FakeCookies()

    const res = await verifyGET({
      url: new URL(`http://localhost/api/auth/verify?token=${rawToken}`),
      cookies: cookies as unknown as AstroCookies,
      redirect: fakeRedirect,
    } as never)

    expect(res.headers.get("Location")).toBe("/?login=expired")
    expect(cookies.get(SESSION_COOKIE_NAME)).toBeUndefined()
  })

  it("rejects a malformed request with no token", async () => {
    const cookies = new FakeCookies()
    const res = await verifyGET({
      url: new URL("http://localhost/api/auth/verify"),
      cookies: cookies as unknown as AstroCookies,
      redirect: fakeRedirect,
    } as never)

    expect(res.headers.get("Location")).toBe("/?login=invalid")
  })
})

describe("POST /api/auth/logout", () => {
  it("revokes the session and clears the cookie", async () => {
    const rawToken = await createSession(db, "logout@example.com", null)
    const cookies = new FakeCookies()
    cookies.set(SESSION_COOKIE_NAME, rawToken)

    const res = await logoutPOST({ cookies: cookies as unknown as AstroCookies } as never)

    expect(res.status).toBe(200)
    expect(cookies.has(SESSION_COOKIE_NAME)).toBe(false)

    const sessions = await db.select().from(schema.sessions)
    expect(sessions).toHaveLength(0)
  })
})
