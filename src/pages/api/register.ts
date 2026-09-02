import type { APIRoute } from "astro"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { randomUUID } from "node:crypto"

import { db } from "@/db/client"
import { friends } from "@/db/schema"
import { getCurrentSession } from "@/lib/auth/session"
import { linkSessionToFriend } from "@/lib/auth/store"

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

const schema = z
  .object({
    name: z.string().trim().min(1, "Ingresa tu nombre.").max(60, "El nombre puede tener hasta 60 caracteres."),
    birthDay: z.coerce
      .number()
      .int("Ingresa un día válido.")
      .min(1, "El día debe estar entre 1 y 31.")
      .max(31, "El día debe estar entre 1 y 31."),
    birthMonth: z.coerce
      .number()
      .int("Ingresa un mes válido.")
      .min(1, "El mes debe estar entre 1 y 12.")
      .max(12, "El mes debe estar entre 1 y 12."),
    birthYear: z.coerce
      .number()
      .int("Ingresa un año válido.")
      .min(1900, "El año debe ser 1900 o posterior.")
      .max(new Date().getFullYear(), "El año no puede estar en el futuro.")
      .optional(),
    website: z.string().max(200),
  })
  .superRefine(({ birthDay, birthMonth, birthYear }, context) => {
    if (birthMonth < 1 || birthMonth > 12 || birthDay < 1 || birthDay > 31) return
    const maximumDay = new Date(birthYear ?? 2024, birthMonth, 0).getDate()
    if (birthDay <= maximumDay) return
    const yearContext = birthYear ? ` en ${birthYear}` : ""
    context.addIssue({
      code: "custom",
      path: ["birthDay"],
      message: `${MONTH_NAMES[birthMonth - 1]} no tiene ${birthDay} días${yearContext}.`,
    })
  })

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getCurrentSession(db, cookies)
  if (!session) return json({ error: "No autorizado." }, 401)

  const body = await request.json().catch(() => null)
  if (!body) return json({ error: "Datos inválidos." }, 400)

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return json({ error: "Revisa los datos marcados.", errors: z.flattenError(parsed.error).fieldErrors }, 400)
  }

  const { name, birthDay, birthMonth, birthYear, website } = parsed.data
  if (website) return json({ error: "No pudimos completar el registro." }, 400)

  const existing = await db.select().from(friends).where(eq(friends.email, session.email)).limit(1)
  if (existing.length > 0) return json({ error: "Ya estás en el círculo con ese correo." }, 409)

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
