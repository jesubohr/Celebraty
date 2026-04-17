import type { APIRoute } from "astro"
import { db } from "../../../db/client"
import { friends } from "../../../db/schema"
import { resend } from "../../../lib/email/resend"
import { DailyBirthdayDigest } from "../../../lib/email/DailyBirthdayDigest"
import { getTodayInBogota } from "../../../lib/today"
import { and, eq } from "drizzle-orm"
import { render } from "@react-email/render"
import React from "react"
import { toZonedTime } from "date-fns-tz"

export const GET: APIRoute = async ({ request }) => {
  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${import.meta.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { month, day } = getTodayInBogota()
  const todayFriends = await db
    .select()
    .from(friends)
    .where(and(eq(friends.birthMonth, month), eq(friends.birthDay, day)))

  if (todayFriends.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { headers: { "Content-Type": "application/json" } })
  }

  const allFriends = await db.select().from(friends)
  const year = toZonedTime(new Date(), "America/Bogota").getFullYear()

  const html = await render(React.createElement(DailyBirthdayDigest, { birthdays: todayFriends, year }))

  const subject =
    todayFriends.length === 1
      ? `🎂 Hoy cumple años ${todayFriends[0].name}!`
      : `🎂 Hoy cumplen años ${todayFriends.length} amigos!`

  const from = import.meta.env.FROM_EMAIL

  const emails = allFriends.map((f) => ({
    from,
    to: f.email,
    subject,
    html,
  }))

  const BATCH = 100
  for (let i = 0; i < emails.length; i += BATCH) {
    await resend.batch.send(emails.slice(i, i + BATCH))
  }

  return new Response(JSON.stringify({ sent: allFriends.length }), {
    headers: { "Content-Type": "application/json" },
  })
}
