import { describe, expect, it } from "vitest"

import { getDateAngle, layoutBirthdayDots } from "@/lib/year"

describe("getDateAngle", () => {
  it("places January 1 at twelve o'clock", () => {
    expect(getDateAngle(1, 1, 2026)).toBe(0)
  })

  it("uses leap-year length for dates in leap years", () => {
    expect(getDateAngle(12, 31, 2028)).toBeCloseTo((365 / 366) * 360)
  })
})

describe("layoutBirthdayDots", () => {
  it("pushes colliding birthdays outward in six-pixel steps", () => {
    const dots = layoutBirthdayDots(
      [
        { id: "a", birthMonth: 6, birthDay: 15 },
        { id: "b", birthMonth: 6, birthDay: 15 },
        { id: "c", birthMonth: 6, birthDay: 16 },
      ],
      2026,
    )

    expect(dots[0].radius).toBe(112)
    expect(dots[1].radius).toBe(124)
    expect(dots[2].radius).toBeGreaterThanOrEqual(118)
    expect((dots[1].radius - dots[0].radius) % 6).toBe(0)
    expect(dots.map((dot) => dot.id)).toEqual(["a", "b", "c"])
  })

  it("is deterministic for repeated calls", () => {
    const birthdays = [
      { id: "b", birthMonth: 1, birthDay: 2 },
      { id: "a", birthMonth: 1, birthDay: 1 },
    ]

    expect(layoutBirthdayDots(birthdays, 2026)).toEqual(layoutBirthdayDots(birthdays, 2026))
  })
})
