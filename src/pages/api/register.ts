import type { APIRoute } from "astro"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { randomUUID } from "node:crypto"

import { db } from "@/db/client"
import { friends } from "@/db/schema"
import { getCurrentSession } from "@/lib/auth/session"
import { linkSessionToFriend } from "@/lib/auth/store"

const schema = z.object({
  name: z.string().min(1).max(60).trim(),
  birthDay: z.coerce.number().int().min(1).max(31),
  birthMonth: z.coerce.number().int().min(1).max(12),
  birthYear: z.coerce.number().int().min(1900).max(new Date().getFullYear()).optional(),
  website: z.string().max(0), // honeypot
})

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getCurrentSession(db, cookies)
  if (!session) return json({ error: "No autorizado." }, 401)

  const body = await request.json().catch(() => null)
  if (!body) return json({ error: "Datos inválidos." }, 400)

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos."
    return json({ error: msg }, 400)
  }

  const { name, birthDay, birthMonth, birthYear, website } = parsed.data
  if (website) return json({ error: "Bot detected." }, 400)

  const existing = await db.select().from(friends).where(eq(friends.email, session.email)).limit(1)
  if (existing.length > 0) return json({ error: "Ya estás registrado con ese correo 🎉" }, 409)

  const friendId = randomUUID()
  await db.insert(friends).values({
    id: friendId,
    name,
    email: session.email,
    birthMonth,
    birthDay,
    birthYear: birthYear ?? null,
    createdAt: Date.now(),
  })

  await linkSessionToFriend(db, session.id, friendId)

  return json({ ok: true })
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}
