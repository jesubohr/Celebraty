import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import EmailLoginForm from "@/components/EmailLoginForm"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("EmailLoginForm", () => {
  it("marks the email field as required for client-side validation", () => {
    render(<EmailLoginForm />)
    const input = screen.getByLabelText("Tu correo") as HTMLInputElement
    expect(input).toBeRequired()
    expect(input.type).toBe("email")
  })

  it("shows a loading state while the request is in flight", async () => {
    let resolveFetch!: (value: Response) => void
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = resolve
    })
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(pending))

    render(<EmailLoginForm />)
    fireEvent.change(screen.getByLabelText("Tu correo"), { target: { value: "a@example.com" } })
    fireEvent.click(screen.getByRole("button"))

    const button = await screen.findByRole("button", { name: "Enviando enlace…" })
    expect(button).toBeDisabled()

    resolveFetch(new Response(JSON.stringify({ ok: true }), { status: 200 }))
  })

  it("shows a success state after a valid submission", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })))

    render(<EmailLoginForm />)
    fireEvent.change(screen.getByLabelText("Tu correo"), { target: { value: "a@example.com" } })
    fireEvent.click(screen.getByRole("button"))

    const heading = await screen.findByRole("heading", { name: "Revisa tu correo" })
    expect(heading).toHaveFocus()
  })

  it("shows the server error message when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Ingresa un correo válido." }), { status: 400 })),
    )

    render(<EmailLoginForm />)
    fireEvent.change(screen.getByLabelText("Tu correo"), { target: { value: "a@example.com" } })
    fireEvent.click(screen.getByRole("button"))

    const input = screen.getByLabelText("Tu correo")
    const error = await screen.findByRole("alert")
    expect(error).toHaveTextContent("Ingresa un correo válido.")
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input).toHaveAttribute("aria-describedby", error.id)
  })

  it("validates the email in Spanish before sending", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    render(<EmailLoginForm />)

    fireEvent.change(screen.getByLabelText("Tu correo"), { target: { value: "correo-invalido" } })
    fireEvent.click(screen.getByRole("button", { name: "Enviar enlace" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Ingresa un correo válido.")
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByLabelText("Tu correo")).toHaveFocus()
  })

  it("clears a stale email error while the user corrects the address", async () => {
    render(<EmailLoginForm />)
    fireEvent.change(screen.getByLabelText("Tu correo"), { target: { value: "correo-invalido" } })
    fireEvent.click(screen.getByRole("button", { name: "Enviar enlace" }))

    expect(await screen.findByRole("alert")).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("Tu correo"), { target: { value: "ana@example.com" } })

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("renders an initial notice for an expired login link", () => {
    render(<EmailLoginForm initialNotice="Tu enlace expiró o ya fue usado. Pide uno nuevo." />)
    expect(screen.getByText("Tu enlace expiró o ya fue usado. Pide uno nuevo.")).toBeInTheDocument()
  })
})
