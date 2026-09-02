import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import YearRing from "@/components/YearRing"
import type { BirthdayCountdown } from "@/lib/birthdays"

const TODAY = new Date("2026-09-02T17:00:00.000Z")
const COUNTDOWNS: BirthdayCountdown[] = [
  { id: "1", displayName: "Ana G.", birthMonth: 9, birthDay: 2, daysUntil: 0, countdownLabel: "Hoy" },
  { id: "2", displayName: "Luis C.", birthMonth: 9, birthDay: 5, daysUntil: 3, countdownLabel: "3d" },
]

describe("YearRing", () => {
  it("renders an empty year with today and the thirty-day arc", () => {
    const { container } = render(<YearRing countdowns={[]} today={TODAY} />)

    expect(screen.getByText("Nadie en el círculo todavía. Sé el primer punto del año.")).toBeInTheDocument()
    expect(container.querySelector("[data-ring-track]")).toBeInTheDocument()
    expect(container.querySelector("[data-window-arc]")).toBeInTheDocument()
    expect(container.querySelector("[data-today-marker]")).toBeInTheDocument()
  })

  it("shows twelve Spanish month ticks", () => {
    const { container } = render(<YearRing countdowns={[]} today={TODAY} />)
    const labels = Array.from(container.querySelectorAll("[data-month-tick]")).map((node) => node.textContent)
    expect(labels).toEqual(["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"])
  })

  it("hides the graphic and exposes the same data in a visible list", () => {
    const { container } = render(<YearRing countdowns={COUNTDOWNS} today={TODAY} />)
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
    expect(screen.getByRole("list")).toHaveTextContent("Ana G.")
    expect(screen.getByRole("list")).toHaveTextContent("Hoy")
    expect(screen.getByRole("list")).toHaveTextContent("Luis C.")
    expect(screen.getByRole("list")).toHaveTextContent("3d")
  })

  it("links keyboard focus and pointer hover to the matching dot", () => {
    const { container } = render(<YearRing countdowns={COUNTDOWNS} today={TODAY} />)
    const row = screen.getByText("Luis C.").closest("li")!
    const dot = container.querySelector('[data-birthday-dot="2"]')

    fireEvent.focus(row)
    expect(dot).toHaveAttribute("data-active", "true")
    fireEvent.blur(row)
    expect(dot).toHaveAttribute("data-active", "false")
    fireEvent.mouseEnter(row)
    expect(dot).toHaveAttribute("data-active", "true")
  })

  it("adds a newly registered birthday when the form announces success", () => {
    const { container } = render(<YearRing countdowns={[]} today={TODAY} />)
    act(() => {
      window.dispatchEvent(
        new CustomEvent("celebraty:registered", {
          detail: {
            id: "new",
            displayName: "Mara P.",
            birthMonth: 9,
            birthDay: 2,
            daysUntil: 0,
            countdownLabel: "Hoy",
          },
        }),
      )
    })

    expect(container.querySelector('[data-birthday-dot="new"]')).toBeInTheDocument()
    expect(screen.getByText("Mara P.")).toBeInTheDocument()
  })

  it("shows an actionable loading error", () => {
    render(<YearRing countdowns={[]} hasError today={TODAY} />)
    expect(screen.getByRole("alert")).toHaveTextContent("Actualiza la página")
  })
})
