import type { APIRoute } from "astro"
import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { friends } from "@/db/schema"
import { consumeLoginToken } from "@/lib/auth/store"
import { establishSession } from "@/lib/auth/session"

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const token = url.searchParams.get("token")
  if (!token) return redirect("/?login=invalid")

  const email = await consumeLoginToken(db, token)
  if (!email) return redirect("/?login=expired")

  const existing = await db.select({ id: friends.id }).from(friends).where(eq(friends.email, email)).limit(1)
  const friendId = existing[0]?.id ?? null

  await establishSession(db, cookies, email, friendId)

  return redirect("/")
}
