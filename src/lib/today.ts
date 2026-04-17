import { toZonedTime } from "date-fns-tz"

const TZ = "America/Bogota"

export function getTodayInBogota(): { month: number; day: number } {
  const now = toZonedTime(new Date(), TZ)
  return { month: now.getMonth() + 1, day: now.getDate() }
}

export function getUpcomingBirthdays(
  friends: { name: string; email: string; birthMonth: number; birthDay: number; birthYear?: number | null }[],
  days = 30,
) {
  const now = toZonedTime(new Date(), TZ)
  const year = now.getFullYear()

  return friends
    .map((f) => {
      let next = new Date(year, f.birthMonth - 1, f.birthDay)
      if (next < now) next = new Date(year + 1, f.birthMonth - 1, f.birthDay)
      const diff = Math.round((next.getTime() - now.setHours(0, 0, 0, 0)) / 86400000)
      return { ...f, daysUntil: diff }
    })
    .filter((f) => f.daysUntil <= days)
    .sort((a, b) => a.daysUntil - b.daysUntil)
}
