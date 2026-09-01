import type { APIRoute } from "astro"

import { db } from "@/db/client"
import { destroySession } from "@/lib/auth/session"

export const POST: APIRoute = async ({ cookies }) => {
  await destroySession(db, cookies)

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  })
}
