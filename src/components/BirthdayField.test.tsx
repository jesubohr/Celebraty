import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import BirthdayField, { type BirthdayValue } from "@/components/BirthdayField"

function renderField(initial: BirthdayValue = { day: "", month: "", year: "" }) {
  let value = initial
  const onChange = vi.fn((next: BirthdayValue) => {
    value = next
    view.rerender(<BirthdayField value={value} onChange={onChange} />)
  })
  const view = render(<BirthdayField value={value} onChange={onChange} />)
  return { ...view, onChange }
}

describe("BirthdayField", () => {
  it("auto-advances through day and month", () => {
    renderField()
    const day = screen.getByLabelText("Día")
    const month = screen.getByLabelText("Mes")
    const year = screen.getByLabelText("Año (opcional)")

    fireEvent.change(day, { target: { value: "15" } })
    expect(month).toHaveFocus()
    fireEvent.change(month, { target: { value: "03" } })

    expect(day).toHaveValue("15")
    expect(month).toHaveValue("03")
    expect(year).toHaveFocus()
  })

  it("advances immediately when a first digit cannot be extended", () => {
    renderField()
    const day = screen.getByLabelText("Día")
    fireEvent.change(day, { target: { value: "4" } })

    expect(day).toHaveValue("04")
    expect(screen.getByLabelText("Mes")).toHaveFocus()
  })

  it("moves back when Backspace is pressed in an empty segment", () => {
    renderField({ day: "15", month: "", year: "" })
    const day = screen.getByLabelText("Día") as HTMLInputElement
    const month = screen.getByLabelText("Mes")
    month.focus()
    fireEvent.keyDown(month, { key: "Backspace" })

    expect(day).toHaveFocus()
    expect(day.selectionStart).toBe(2)
  })

  it("distributes a pasted date across every segment", () => {
    renderField()
    fireEvent.paste(screen.getByLabelText("Día"), {
      clipboardData: { getData: () => "15/03/1998" },
    })

    expect(screen.getByLabelText("Día")).toHaveValue("15")
    expect(screen.getByLabelText("Mes")).toHaveValue("03")
    expect(screen.getByLabelText("Año (opcional)")).toHaveValue("1998")
  })

  it("names an impossible day after blur", () => {
    renderField({ day: "31", month: "02", year: "" })
    const day = screen.getByLabelText("Día")
    fireEvent.blur(day)

    expect(screen.getByText("Febrero no tiene 31 días.")).toBeInTheDocument()
    expect(day).toHaveAttribute("aria-invalid", "true")
    expect(day).toHaveAttribute("aria-describedby", "birthday-error")
  })

  it("uses one labelled group and text inputs with numeric keyboards", () => {
    renderField()
    expect(screen.getByRole("group", { name: "Tu cumpleaños" })).toBeInTheDocument()
    for (const input of screen.getAllByRole("textbox")) {
      expect(input).toHaveAttribute("inputmode", "numeric")
      expect(input).toHaveAttribute("pattern", "[0-9]*")
    }
  })
})
