import { getDayOfYear, getDaysInYear } from "date-fns"

const CENTER = 160
const BASE_RADIUS = 112
const COLLISION_STEP = 6
const MIN_DOT_DISTANCE = 12

export interface BirthdayDate {
  id: string
  birthMonth: number
  birthDay: number
}

export interface BirthdayDot extends BirthdayDate {
  angle: number
  radius: number
  x: number
  y: number
}

export function getDateAngle(month: number, day: number, year: number): number {
  const date = new Date(year, month - 1, day)
  return ((getDayOfYear(date) - 1) / getDaysInYear(date)) * 360
}

export function pointOnRing(angle: number, radius: number, center = CENTER) {
  const theta = (angle * Math.PI) / 180
  return {
    x: center + radius * Math.sin(theta),
    y: center - radius * Math.cos(theta),
  }
}

export function layoutBirthdayDots(birthdays: BirthdayDate[], year: number): BirthdayDot[] {
  const ordered = birthdays
    .map((birthday) => ({ ...birthday, angle: getDateAngle(birthday.birthMonth, birthday.birthDay, year) }))
    .sort((a, b) => a.angle - b.angle || a.id.localeCompare(b.id))

  const dots: BirthdayDot[] = []
  for (const birthday of ordered) {
    let radius = BASE_RADIUS
    let position = pointOnRing(birthday.angle, radius)

    while (dots.some((dot) => Math.hypot(dot.x - position.x, dot.y - position.y) < MIN_DOT_DISTANCE - 0.01)) {
      radius += COLLISION_STEP
      position = pointOnRing(birthday.angle, radius)
    }

    dots.push({ ...birthday, radius, ...position })
  }

  return dots
}
