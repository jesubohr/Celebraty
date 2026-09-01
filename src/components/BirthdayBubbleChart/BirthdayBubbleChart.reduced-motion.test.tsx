import { describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"

// Must run before any motion component mounts in this module: framer-motion
// latches its reduced-motion preference from matchMedia exactly once per
// module registry and never re-reads it, so a later stub would be ignored.
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

class MockResizeObserver {
  callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe() {
    this.callback([{ contentRect: { width: 360 } } as ResizeObserverEntry], this as unknown as ResizeObserver)
  }
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", MockResizeObserver)

const { default: BirthdayBubbleChart } = await import("@/components/BirthdayBubbleChart/BirthdayBubbleChart")

describe("prefers-reduced-motion", () => {
  it("skips entrance animation on the bubble chart", () => {
    const { container } = render(
      <BirthdayBubbleChart
        countdowns={[{ id: "1", displayName: "Ana G.", birthMonth: 6, birthDay: 15, daysUntil: 0, countdownLabel: "Hoy" }]}
      />,
    )

    const group = container.querySelector("svg g")
    expect(group).toHaveAttribute("style", expect.stringContaining("opacity: 1"))
  })
})
