import type { APIRoute } from "astro"
import { z } from "zod"
import { db } from "../../db/client"
import { friends } from "../../db/schema"
import { eq } from "drizzle-orm"
import { randomUUID } from "crypto"

const schema = z.object({
  name: z.string().min(1).max(60).trim(),
  email: z.string().email().toLowerCase(),
  birthDay: z.coerce.number().int().min(1).max(31),
  birthMonth: z.coerce.number().int().min(1).max(12),
  birthYear: z.coerce.number().int().min(1900).max(new Date().getFullYear()).optional(),
  website: z.string().max(0), // honeypot
})

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null)
  if (!body) return json({ error: "Datos inválidos." }, 400)

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos."
    return json({ error: msg }, 400)
  }

  const { name, email, birthDay, birthMonth, birthYear, website } = parsed.data
  if (website) return json({ error: "Bot detected." }, 400)

  const existing = await db.select().from(friends).where(eq(friends.email, email)).limit(1)
  if (existing.length > 0) return json({ error: "Ya estás registrado con ese correo 🎉" }, 409)

  await db.insert(friends).values({
    id: randomUUID(),
    name,
    email,
    birthMonth,
    birthDay,
    birthYear: birthYear ?? null,
    createdAt: Date.now(),
  })

  return json({ ok: true })
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}
