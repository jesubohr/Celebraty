import { toZonedTime } from "date-fns-tz"

export const BOGOTA_TZ = "America/Bogota"

export interface BirthdayCountdown {
  id: string
  displayName: string
  birthMonth: number
  birthDay: number
  daysUntil: number
  countdownLabel: string
}

function startOfBogotaDay(now: Date): Date {
  const zoned = toZonedTime(now, BOGOTA_TZ)
  zoned.setHours(0, 0, 0, 0)
  return zoned
}

export function daysUntilNextBirthday(birthMonth: number, birthDay: number, now: Date = new Date()): number {
  const today = startOfBogotaDay(now)
  const year = today.getFullYear()

  let next = new Date(year, birthMonth - 1, birthDay)
  if (next < today) next = new Date(year + 1, birthMonth - 1, birthDay)

  return Math.round((next.getTime() - today.getTime()) / 86400000)
}

export function formatCountdownLabel(daysUntil: number): string {
  if (daysUntil === 0) return "Hoy"
  if (daysUntil <= 30) return `${daysUntil}d`
  const months = Math.max(1, Math.floor(daysUntil / 30))
  return `${months}m`
}

export function abbreviateName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]

  const first = parts[0]
  const lastInitial = parts[parts.length - 1][0].toUpperCase()
  return `${first} ${lastInitial}.`
}

export function sortCountdowns(a: BirthdayCountdown, b: BirthdayCountdown): number {
  if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil
  const nameCompare = a.displayName.localeCompare(b.displayName)
  if (nameCompare !== 0) return nameCompare
  return a.id.localeCompare(b.id)
}

export interface BirthdaySource {
  id: string
  name: string
  birthMonth: number
  birthDay: number
}

export function toBirthdayCountdown(friend: BirthdaySource, now: Date = new Date()): BirthdayCountdown {
  const daysUntil = daysUntilNextBirthday(friend.birthMonth, friend.birthDay, now)
  return {
    id: friend.id,
    displayName: abbreviateName(friend.name),
    birthMonth: friend.birthMonth,
    birthDay: friend.birthDay,
    daysUntil,
    countdownLabel: formatCountdownLabel(daysUntil),
  }
}

export function getBirthdayCountdowns(friends: BirthdaySource[], now: Date = new Date()): BirthdayCountdown[] {
  return friends.map((f) => toBirthdayCountdown(f, now)).sort(sortCountdowns)
}
