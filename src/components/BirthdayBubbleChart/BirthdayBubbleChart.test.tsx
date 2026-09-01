import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import BirthdayBubbleChart from "@/components/BirthdayBubbleChart/BirthdayBubbleChart"
import type { BirthdayCountdown } from "@/lib/birthdays"

const COUNTDOWNS: BirthdayCountdown[] = [
  { id: "1", displayName: "Ana G.", birthMonth: 6, birthDay: 15, daysUntil: 0, countdownLabel: "Hoy" },
  { id: "2", displayName: "Luis C.", birthMonth: 7, birthDay: 1, daysUntil: 16, countdownLabel: "16d" },
  { id: "3", displayName: "Maximiliano Rodríguez G.", birthMonth: 9, birthDay: 1, daysUntil: 78, countdownLabel: "2m" },
]

function mockResizeObserver(width: number) {
  class MockResizeObserver {
    callback: ResizeObserverCallback
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
    }
    observe() {
      this.callback(
        [{ contentRect: { width } } as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      )
    }
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", MockResizeObserver)
}

describe("BirthdayBubbleChart", () => {
  it("shows an actionable message when the circle failed to load", () => {
    mockResizeObserver(360)
    render(<BirthdayBubbleChart countdowns={[]} hasError />)
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar el círculo")
  })

  it("shows an empty state when nobody is registered yet", () => {
    mockResizeObserver(360)
    render(<BirthdayBubbleChart countdowns={[]} />)
    expect(screen.getByText("Todavía no hay nadie registrado. ¡Sé el primero! 🌱")).toBeInTheDocument()
  })

  it("renders every abbreviated name and countdown label visually", () => {
    mockResizeObserver(360)
    const { container } = render(<BirthdayBubbleChart countdowns={COUNTDOWNS} />)

    const svgText = Array.from(container.querySelectorAll("svg text")).map((el) => el.textContent)
    for (const c of COUNTDOWNS) {
      expect(svgText).toContain(c.displayName)
      expect(svgText).toContain(c.countdownLabel)
    }
  })

  it("provides an ordered textual equivalent for assistive technology", () => {
    mockResizeObserver(360)
    render(<BirthdayBubbleChart countdowns={COUNTDOWNS} />)

    const list = screen.getByRole("list", { hidden: true })
    expect(list.tagName).toBe("OL")
    expect(list).toHaveTextContent("Ana G.: cumple hoy")
    expect(list).toHaveTextContent("Luis C.: faltan 16d")
  })

  it("hides the SVG from assistive technology since it is decorative", () => {
    mockResizeObserver(360)
    const { container } = render(<BirthdayBubbleChart countdowns={COUNTDOWNS} />)
    const svg = container.querySelector("svg")
    expect(svg).toHaveAttribute("aria-hidden", "true")
  })
})
