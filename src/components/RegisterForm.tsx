import { motion, useReducedMotion } from "motion/react"
import { useEffect, useRef, useState } from "react"

import BirthdayField, { getBirthdayError, type BirthdayValue } from "@/components/BirthdayField"
import { toBirthdayCountdown } from "@/lib/birthdays"

type Status = "idle" | "loading" | "success" | "error"
type FieldErrors = Partial<Record<"name" | "birthday", string>>

interface Props {
  email: string
}

interface RegisterErrorResponse {
  error?: string
  errors?: Partial<Record<"name" | "birthDay" | "birthMonth" | "birthYear", string[]>>
}

const spring = { type: "spring" as const, stiffness: 300, damping: 30, bounce: 0 }

function focusBirthdayDay() {
  document.querySelector<HTMLInputElement>('[aria-label="Día"]')?.focus()
}

export default function RegisterForm({ email }: Props) {
  const reducedMotion = useReducedMotion()
  const successHeadingRef = useRef<HTMLHeadingElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>("idle")
  const [formError, setFormError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [name, setName] = useState("")
  const [birthday, setBirthday] = useState<BirthdayValue>({ day: "", month: "", year: "" })
  const [website, setWebsite] = useState("")

  useEffect(() => {
    if (status === "success") successHeadingRef.current?.focus()
  }, [status])

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setFormError("")
    setFieldErrors({})

    const nextErrors: FieldErrors = {
      name: name.trim() ? undefined : "Ingresa tu nombre.",
      birthday: getBirthdayError(birthday),
    }
    if (nextErrors.name || nextErrors.birthday) {
      setStatus("error")
      setFieldErrors(nextErrors)
      if (nextErrors.name) nameRef.current?.focus()
      else focusBirthdayDay()
      return
    }

    setStatus("loading")
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          birthMonth: Number(birthday.month),
          birthDay: Number(birthday.day),
          birthYear: birthday.year ? Number(birthday.year) : undefined,
          website,
        }),
      })
      const data = (await response.json().catch(() => ({}))) as RegisterErrorResponse

      if (!response.ok) {
        const serverErrors = data.errors ?? {}
        const birthdayError = serverErrors.birthDay?.[0] ?? serverErrors.birthMonth?.[0] ?? serverErrors.birthYear?.[0]
        const nextServerErrors = { name: serverErrors.name?.[0], birthday: birthdayError }
        setStatus("error")
        setFieldErrors(nextServerErrors)
        setFormError(
          nextServerErrors.name || nextServerErrors.birthday
            ? ""
            : (data.error ?? "No pudimos completar tu registro. Revisa los datos e inténtalo de nuevo."),
        )
        if (nextServerErrors.name) nameRef.current?.focus()
        else if (nextServerErrors.birthday) focusBirthdayDay()
        return
      }

      const countdown = toBirthdayCountdown({
        id: "new-registration",
        name: name.trim(),
        birthMonth: Number(birthday.month),
        birthDay: Number(birthday.day),
      })
      window.dispatchEvent(new CustomEvent("celebraty:registered", { detail: countdown }))
      setStatus("success")
      window.setTimeout(() => window.location.assign("/"), 900)
    } catch {
      setStatus("error")
      setFormError("No pudimos completar tu registro. Revisa tu conexión e inténtalo de nuevo.")
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
          Ya estás en el círculo
        </h2>
        <p className="text-sm text-ink-muted">Te avisaremos por correo cuando alguien cumpla años.</p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate aria-busy={status === "loading"}>
      <input
        type="text"
        name="website"
        value={website}
        onChange={(event) => setWebsite(event.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <Field label="Tu nombre" inputId="register-name" error={fieldErrors.name}>
        <input
          ref={nameRef}
          id="register-name"
          name="name"
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setFieldErrors((current) => ({ ...current, name: undefined }))
            setFormError("")
          }}
          required
          maxLength={60}
          autoComplete="name"
          placeholder="Ana García"
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={fieldErrors.name ? "register-name-error" : undefined}
          className="input"
        />
      </Field>

      <Field label="Tu correo" inputId="register-email">
        <input
          id="register-email"
          name="email"
          type="email"
          value={email}
          readOnly
          autoComplete="email"
          className="input cursor-not-allowed opacity-70"
        />
      </Field>

      <BirthdayField
        value={birthday}
        onChange={(nextBirthday) => {
          setBirthday(nextBirthday)
          setFieldErrors((current) => ({ ...current, birthday: undefined }))
          setFormError("")
        }}
        error={fieldErrors.birthday}
      />

      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}

      <motion.button
        type="submit"
        disabled={status === "loading"}
        whileTap={reducedMotion ? undefined : { scale: 0.96 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className="btn-primary"
      >
        {status === "loading" ? "Uniéndote…" : "Unirme"}
      </motion.button>
    </form>
  )
}

function Field({
  label,
  inputId,
  error,
  children,
}: {
  label: string
  inputId: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
