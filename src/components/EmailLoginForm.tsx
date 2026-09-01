import { useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"

type Status = "idle" | "loading" | "success" | "error"

const spring = { type: "spring" as const, stiffness: 300, damping: 30 }

interface Props {
  initialNotice?: string
}

export default function EmailLoginForm({ initialNotice }: Props) {
  const reduced = useReducedMotion()
  const [status, setStatus] = useState<Status>("idle")
  const [email, setEmail] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setErrorMsg("")

    const res = await fetch("/api/auth/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    if (res.ok) {
      setStatus("success")
    } else {
      const data = await res.json().catch(() => null)
      setStatus("error")
      setErrorMsg(data?.error ?? "Algo salió mal.")
    }
  }

  if (status === "success") {
    return (
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={spring}
        className="text-center py-8 space-y-2"
      >
        <div className="text-4xl">📬</div>
        <p className="text-warm-dark font-semibold text-lg">Revisa tu correo</p>
        <p className="text-warm-muted text-sm">Te enviamos un enlace para entrar. Vence en 15 minutos.</p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {initialNotice && (
        <p className="text-warm-muted text-sm text-center bg-warm-bg border border-warm-border rounded-2xl px-4 py-3">
          {initialNotice}
        </p>
      )}

      <Field label="Tu correo">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="ana@email.com"
          className="input"
        />
      </Field>

      <AnimatePresence>
        {status === "error" && (
          <motion.p
            key="err"
            initial={reduced ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-red-500 text-sm"
          >
            {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        type="submit"
        disabled={status === "loading"}
        whileTap={reduced ? {} : { scale: 0.98 }}
        transition={{ duration: 0.1 }}
        className="w-full btn-primary"
      >
        {status === "loading" ? "Enviando…" : "Enviar enlace de acceso"}
      </motion.button>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="block text-sm font-medium text-warm-dark">{label}</span>
      {children}
    </label>
  )
}
