import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

class ReducedMotionMediaQueryList {
  matches = true
  media: string
  constructor(media: string) {
    this.media = media
  }
  addEventListener() {}
  removeEventListener() {}
}

vi.stubGlobal(
  "matchMedia",
  vi.fn((query: string) => new ReducedMotionMediaQueryList(query)) as unknown as typeof window.matchMedia,
)

const { default: YearRing } = await import("@/components/YearRing")

describe("YearRing reduced motion", () => {
  it("renders the ring and dots in their final state", () => {
    const { container } = render(
      <YearRing
        today={new Date("2026-09-02T17:00:00.000Z")}
        countdowns={[
          { id: "1", displayName: "Ana G.", birthMonth: 9, birthDay: 2, daysUntil: 0, countdownLabel: "Hoy" },
        ]}
      />,
    )

    expect(container.querySelector("[data-ring-track]")).toHaveAttribute("style", expect.stringContaining("opacity: 1"))
    expect(container.querySelector('[data-birthday-dot="1"]')).toHaveAttribute(
      "style",
      expect.stringContaining("opacity: 1"),
    )
  })
})
