import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import RegisterForm from "@/components/RegisterForm"

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function fillValidForm() {
  fireEvent.change(screen.getByLabelText("Tu nombre"), { target: { value: "Ana García" } })
  fireEvent.change(screen.getByLabelText("Día"), { target: { value: "15" } })
  fireEvent.change(screen.getByLabelText("Mes"), { target: { value: "03" } })
  fireEvent.change(screen.getByLabelText("Año (opcional)"), { target: { value: "1998" } })
}

describe("RegisterForm", () => {
  it("uses the segmented birthday field without number inputs or a select", () => {
    const { container } = render(<RegisterForm email="ana@example.com" />)
    expect(screen.getByRole("group", { name: "Tu cumpleaños" })).toBeInTheDocument()
    expect(container.querySelector('input[type="number"]')).not.toBeInTheDocument()
    expect(container.querySelector("select")).not.toBeInTheDocument()
  })

  it("blocks an impossible birthday before sending", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    render(<RegisterForm email="ana@example.com" />)
    fireEvent.change(screen.getByLabelText("Tu nombre"), { target: { value: "Ana García" } })
    fireEvent.change(screen.getByLabelText("Día"), { target: { value: "31" } })
    fireEvent.change(screen.getByLabelText("Mes"), { target: { value: "02" } })
    fireEvent.click(screen.getByRole("button", { name: "Unirme" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Febrero no tiene 31 días.")
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByLabelText("Día")).toHaveFocus()
  })

  it("links server field errors to their input", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: "Revisa los datos marcados.", errors: { name: ["Ingresa tu nombre."] } }),
          { status: 400 },
        ),
      ),
    )
    render(<RegisterForm email="ana@example.com" />)
    fillValidForm()
    fireEvent.click(screen.getByRole("button", { name: "Unirme" }))

    const name = screen.getByLabelText("Tu nombre")
    const error = await screen.findByText("Ingresa tu nombre.")
    expect(name).toHaveAttribute("aria-invalid", "true")
    expect(name).toHaveAttribute("aria-describedby", error.id)
    expect(name).toHaveFocus()
  })

  it("moves focus to success and announces the new dot", async () => {
    vi.useFakeTimers()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })))
    const registered = vi.fn()
    window.addEventListener("celebraty:registered", registered)
    render(<RegisterForm email="ana@example.com" />)
    fillValidForm()
    fireEvent.click(screen.getByRole("button", { name: "Unirme" }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(50)
    })
    const heading = screen.getByRole("heading", { name: "Ya estás en el círculo" })
    expect(heading).toHaveFocus()
    expect(registered).toHaveBeenCalledOnce()
    window.removeEventListener("celebraty:registered", registered)
  })

  it("names a network failure and recovery", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")))
    render(<RegisterForm email="ana@example.com" />)
    fillValidForm()
    fireEvent.click(screen.getByRole("button", { name: "Unirme" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No pudimos completar tu registro. Revisa tu conexión e inténtalo de nuevo.",
    )
  })
})
