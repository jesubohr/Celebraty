import { friends } from "@/db/schema"
import { db } from "@/db/client"
import { tryCatch } from "@/lib/try-catch"
import { getBirthdayCountdowns as computeBirthdayCountdowns, type BirthdayCountdown } from "@/lib/birthdays"

export type { BirthdayCountdown }

export async function getBirthdayCountdowns(now: Date = new Date()): Promise<BirthdayCountdown[]> {
  const result = await tryCatch(
    db
      .select({
        id: friends.id,
        name: friends.name,
        birthMonth: friends.birthMonth,
        birthDay: friends.birthDay,
      })
      .from(friends),
  )
  if (result.error) return []

  return computeBirthdayCountdowns(result.data, now)
}
