import { motion, useReducedMotion } from "motion/react"
import { useEffect, useRef, useState } from "react"

type Status = "idle" | "loading" | "success" | "error"

const spring = { type: "spring" as const, stiffness: 300, damping: 30, bounce: 0 }

interface Props {
  initialNotice?: string
}

export default function EmailLoginForm({ initialNotice }: Props) {
  const reducedMotion = useReducedMotion()
  const inputRef = useRef<HTMLInputElement>(null)
  const successHeadingRef = useRef<HTMLHeadingElement>(null)
  const [status, setStatus] = useState<Status>("idle")
  const [email, setEmail] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (status === "success") successHeadingRef.current?.focus()
  }, [status])

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setErrorMessage("")

    if (!inputRef.current?.validity.valid) {
      setStatus("error")
      setErrorMessage("Ingresa un correo válido.")
      inputRef.current?.focus()
      return
    }

    setStatus("loading")
    try {
      const response = await fetch("/api/auth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setStatus("success")
        return
      }

      const data = await response.json().catch(() => null)
      setStatus("error")
      setErrorMessage(data?.error ?? "No pudimos enviar el enlace. Revisa tu correo e inténtalo de nuevo.")
      inputRef.current?.focus()
    } catch {
      setStatus("error")
      setErrorMessage("No pudimos enviar el enlace. Revisa tu conexión e inténtalo de nuevo.")
      inputRef.current?.focus()
    }
  }

  if (status === "success") {
    return (
      <motion.div
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={spring}
        className="space-y-2 py-8 text-center"
      >
        <h2 ref={successHeadingRef} tabIndex={-1} className="text-lg font-semibold text-ink">
          Revisa tu correo
        </h2>
        <p className="text-sm text-ink-muted">Te enviamos un enlace para entrar. Vence en 15 minutos.</p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate aria-busy={status === "loading"}>
      {initialNotice && (
        <p
          role="status"
          className="rounded-2xl border border-line bg-surface px-4 py-3 text-center text-sm text-ink-muted"
        >
          {initialNotice}
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor="login-email" className="block text-sm font-medium text-ink">
          Tu correo
        </label>
        <input
          ref={inputRef}
          id="login-email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setErrorMessage("")
          }}
          required
          autoComplete="email"
          spellCheck={false}
          placeholder="ana@email.com"
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={errorMessage ? "login-email-error" : undefined}
          className="input"
        />
        {errorMessage && (
          <p id="login-email-error" role="alert" className="text-sm text-danger">
            {errorMessage}
          </p>
        )}
      </div>

      <motion.button
        type="submit"
        disabled={status === "loading"}
        whileTap={reducedMotion ? undefined : { scale: 0.96 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className="btn-primary"
      >
        {status === "loading" ? "Enviando enlace…" : "Enviar enlace"}
      </motion.button>
    </form>
  )
}
