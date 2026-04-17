import { toZonedTime } from "date-fns-tz"
import { friends } from "@/db/schema"
import { db } from "@/db/client"
import { tryCatch } from "@/lib/try-catch"

const TZ = "America/Bogota"

export async function getUpcomingBirthdays() {
  const result = await tryCatch(db.select().from(friends))
  if (result.error) {
    return []
  }

  const allUsers = result.data
  const now = toZonedTime(new Date(), TZ)
  const year = now.getFullYear()

  return allUsers
    .map((f) => {
      let next = new Date(year, f.birthMonth - 1, f.birthDay)
      if (next < now) next = new Date(year + 1, f.birthMonth - 1, f.birthDay)
      const diff = Math.round((next.getTime() - now.setHours(0, 0, 0, 0)) / 86400000)
      return { ...f, daysUntil: diff }
    })
    .filter((f) => f.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)
}
