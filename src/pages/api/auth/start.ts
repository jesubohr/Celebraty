import React from "react"
import type { APIRoute } from "astro"
import { z } from "zod"
import { render } from "react-email"

import { db } from "@/db/client"
import { normalizeEmail } from "@/lib/normalize-email"
import { createLoginToken, isLoginRateLimited } from "@/lib/auth/store"
import { resend } from "@/lib/email/resend"
import { LoginLink } from "@/lib/email/LoginLink"

const schema = z.object({
  email: z.string().trim().pipe(z.email()),
})

const GENERIC_RESPONSE = {
  ok: true,
  message: "Si el correo existe, te enviamos un enlace para entrar.",
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null)
  if (!body) return json({ error: "Datos inválidos." }, 400)

  const parsed = schema.safeParse(body)
  if (!parsed.success) return json({ error: "Ingresa un correo válido." }, 400)

  const email = normalizeEmail(parsed.data.email)

  const limited = await isLoginRateLimited(db, email)
  if (!limited) {
    const rawToken = await createLoginToken(db, email)
    const loginUrl = `${import.meta.env.APP_URL}/api/auth/verify?token=${rawToken}`
    const html = await render(React.createElement(LoginLink, { loginUrl }))

    await resend.emails.send({
      from: import.meta.env.FROM_EMAIL,
      to: email,
      subject: "Tu enlace para entrar a Celebraty",
      html,
    })
  }

  return json(GENERIC_RESPONSE)
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}
