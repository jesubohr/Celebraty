import { describe, expect, it } from "vitest"
import {
  abbreviateName,
  daysUntilNextBirthday,
  formatCountdownLabel,
  getBirthdayCountdowns,
  toBirthdayCountdown,
} from "@/lib/birthdays"

// 2026-06-15 12:00 Bogotá (UTC-5) expressed in UTC.
const NOW = new Date("2026-06-15T17:00:00.000Z")

describe("daysUntilNextBirthday", () => {
  it("returns 0 for a birthday today", () => {
    expect(daysUntilNextBirthday(6, 15, NOW)).toBe(0)
  })

  it("returns 1 for a birthday tomorrow", () => {
    expect(daysUntilNextBirthday(6, 16, NOW)).toBe(1)
  })

  it("rolls over from December to January", () => {
    const newYearsEve = new Date("2026-12-31T17:00:00.000Z")
    expect(daysUntilNextBirthday(1, 1, newYearsEve)).toBe(1)
  })

  it("wraps a birthday earlier this year to next year", () => {
    expect(daysUntilNextBirthday(1, 1, NOW)).toBe(200)
  })
})

describe("formatCountdownLabel", () => {
  it("labels today as Hoy", () => {
    expect(formatCountdownLabel(0)).toBe("Hoy")
  })

  it("labels 1 through 30 days as Nd", () => {
    expect(formatCountdownLabel(1)).toBe("1d")
    expect(formatCountdownLabel(30)).toBe("30d")
  })

  it("labels 31 days and beyond as whole months", () => {
    expect(formatCountdownLabel(31)).toBe("1m")
    expect(formatCountdownLabel(59)).toBe("1m")
    expect(formatCountdownLabel(60)).toBe("2m")
  })
})

describe("abbreviateName", () => {
  it("keeps a single-part name unchanged", () => {
    expect(abbreviateName("Cher")).toBe("Cher")
  })

  it("abbreviates the final name to an initial", () => {
    expect(abbreviateName("John Doe")).toBe("John D.")
  })

  it("uses only the first and final parts for multi-word names", () => {
    expect(abbreviateName("Maria Jose Rodriguez")).toBe("Maria R.")
  })
})

describe("toBirthdayCountdown", () => {
  it("never includes email or birth year fields", () => {
    const countdown = toBirthdayCountdown({ id: "1", name: "Ana García", birthMonth: 6, birthDay: 15 }, NOW)
    expect(countdown).toEqual({
      id: "1",
      displayName: "Ana G.",
      birthMonth: 6,
      birthDay: 15,
      daysUntil: 0,
      countdownLabel: "Hoy",
    })
  })
})

describe("getBirthdayCountdowns", () => {
  it("sorts by daysUntil, then name, then id for deterministic ties", () => {
    const friends = [
      { id: "b", name: "Zoe Alpha", birthMonth: 6, birthDay: 20 },
      { id: "a", name: "Ana Beta", birthMonth: 6, birthDay: 20 },
      { id: "c", name: "Ana Beta", birthMonth: 6, birthDay: 16 },
      { id: "d", name: "Ana Beta", birthMonth: 6, birthDay: 15 },
    ]

    const result = getBirthdayCountdowns(friends, NOW)
    expect(result.map((f) => f.id)).toEqual(["d", "c", "a", "b"])
  })

  it("returns an empty list for an empty circle", () => {
    expect(getBirthdayCountdowns([], NOW)).toEqual([])
  })

  it("keeps same-day birthdays correct regardless of insert order", () => {
    const friends = [
      { id: "later", name: "Luis Cano", birthMonth: 6, birthDay: 18 },
      { id: "today-z", name: "Zoe Alba", birthMonth: 6, birthDay: 15 },
      { id: "today-a", name: "Ana Beta", birthMonth: 6, birthDay: 15 },
    ]

    const result = getBirthdayCountdowns(friends, NOW)

    expect(result.map(({ id, daysUntil, countdownLabel }) => ({ id, daysUntil, countdownLabel }))).toEqual([
      { id: "today-a", daysUntil: 0, countdownLabel: "Hoy" },
      { id: "today-z", daysUntil: 0, countdownLabel: "Hoy" },
      { id: "later", daysUntil: 3, countdownLabel: "3d" },
    ])
  })
})
