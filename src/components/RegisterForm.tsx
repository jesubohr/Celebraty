import { useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"

type Status = "idle" | "loading" | "success" | "error"

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

const spring = { type: "spring" as const, stiffness: 300, damping: 30 }

export default function RegisterForm() {
  const reduced = useReducedMotion()
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [form, setForm] = useState({
    name: "",
    email: "",
    birthMonth: "",
    birthDay: "",
    birthYear: "",
    website: "",
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setErrorMsg("")

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        birthMonth: Number(form.birthMonth),
        birthDay: Number(form.birthDay),
        birthYear: form.birthYear ? Number(form.birthYear) : undefined,
        website: form.website,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      setStatus("success")
    } else {
      setStatus("error")
      setErrorMsg(data.error ?? "Algo salió mal.")
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
        <div className="text-4xl">🎉</div>
        <p className="text-warm-dark font-semibold text-lg">¡Listo! Ya estás en la lista.</p>
        <p className="text-warm-muted text-sm">Te llegará un email cuando alguien cumpla años.</p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* honeypot */}
      <input
        type="text"
        name="website"
        value={form.website}
        onChange={set("website")}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <Field label="Tu nombre">
        <input
          type="text"
          value={form.name}
          onChange={set("name")}
          required
          maxLength={60}
          placeholder="Ana García"
          className="input"
        />
      </Field>

      <Field label="Tu correo">
        <input
          type="email"
          value={form.email}
          onChange={set("email")}
          required
          placeholder="ana@email.com"
          className="input"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Mes de nacimiento">
          <select value={form.birthMonth} onChange={set("birthMonth")} required className="input">
            <option value="">— Mes —</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Día de nacimiento">
          <input
            type="number"
            value={form.birthDay}
            onChange={set("birthDay")}
            required
            min={1}
            max={31}
            placeholder="15"
            className="input"
          />
        </Field>
      </div>

      <Field label="Año (opcional)">
        <input
          type="number"
          value={form.birthYear}
          onChange={set("birthYear")}
          min={1900}
          max={new Date().getFullYear()}
          placeholder={String(new Date().getFullYear() - 25)}
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
        {status === "loading" ? "Registrando…" : "Unirme al círculo 🎂"}
      </motion.button>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-warm-dark">{label}</label>
      {children}
    </div>
  )
}
