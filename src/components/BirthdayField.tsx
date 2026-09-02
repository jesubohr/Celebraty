import { useId, useRef, useState } from "react"

export interface BirthdayValue {
  day: string
  month: string
  year: string
}

type Segment = keyof BirthdayValue

interface Props {
  value: BirthdayValue
  onChange: (value: BirthdayValue) => void
  error?: string
}

const SEGMENTS: Segment[] = ["day", "month", "year"]
const MONTH_NAMES = [
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

function daysInMonth(month: number): number {
  return new Date(2024, month, 0).getDate()
}

export function getBirthdayError(value: BirthdayValue): string | undefined {
  const day = Number(value.day)
  const month = Number(value.month)
  const year = Number(value.year)
  const currentYear = new Date().getFullYear()

  if (!value.day) return "Ingresa el día de tu cumpleaños."
  if (day < 1 || day > 31) return "El día debe estar entre 1 y 31."
  if (!value.month) return "Ingresa el mes de tu cumpleaños."
  if (month < 1 || month > 12) return "El mes debe estar entre 1 y 12."
  if (day > daysInMonth(month)) return `${MONTH_NAMES[month - 1]} no tiene ${day} días.`
  if (value.year && (value.year.length !== 4 || year < 1900 || year > currentYear)) {
    return `El año debe estar entre 1900 y ${currentYear}.`
  }
}

export default function BirthdayField({ value, onChange, error: externalError }: Props) {
  const labelId = useId()
  const errorId = "birthday-error"
  const refs = useRef<Record<Segment, HTMLInputElement | null>>({ day: null, month: null, year: null })
  const [touched, setTouched] = useState(false)
  const error = externalError ?? (touched ? getBirthdayError(value) : undefined)

  const focusSegment = (segment: Segment, atEnd = false) => {
    const input = refs.current[segment]
    input?.focus()
    if (atEnd) input?.setSelectionRange(input.value.length, input.value.length)
  }

  const update = (segment: Segment, nextValue: string) => {
    const digits = nextValue.replace(/\D/g, "")
    const maxLength = segment === "year" ? 4 : 2
    let next = digits.slice(0, maxLength)
    const shouldAdvance =
      segment !== "year" &&
      (next.length === maxLength || (next.length === 1 && Number(next) > (segment === "day" ? 3 : 1)))

    if (shouldAdvance && next.length === 1) next = next.padStart(2, "0")
    onChange({ ...value, [segment]: next })

    if (shouldAdvance) focusSegment(segment === "day" ? "month" : "year")
  }

  const handleBlur = (segment: Segment) => {
    setTouched(true)
    if ((segment === "day" || segment === "month") && value[segment].length === 1) {
      onChange({ ...value, [segment]: value[segment].padStart(2, "0") })
    }
  }

  const handleKeyDown = (segment: Segment, event: React.KeyboardEvent<HTMLInputElement>) => {
    const index = SEGMENTS.indexOf(segment)
    const input = event.currentTarget

    if (event.key === "Backspace" && !value[segment] && index > 0) {
      event.preventDefault()
      focusSegment(SEGMENTS[index - 1], true)
      return
    }

    if (event.key === "ArrowLeft" && input.selectionStart === 0 && index > 0) {
      event.preventDefault()
      focusSegment(SEGMENTS[index - 1], true)
      return
    }

    if (event.key === "ArrowRight" && input.selectionStart === input.value.length && index < SEGMENTS.length - 1) {
      event.preventDefault()
      focusSegment(SEGMENTS[index + 1])
      return
    }

    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return
    event.preventDefault()
    const direction = event.key === "ArrowUp" ? 1 : -1
    const max = segment === "day" ? daysInMonth(Number(value.month) || 1) : segment === "month" ? 12 : new Date().getFullYear()
    const min = segment === "year" ? 1900 : 1
    const fallback = segment === "year" ? new Date().getFullYear() : min
    const next = Math.min(max, Math.max(min, (Number(value[segment]) || fallback) + direction))
    onChange({ ...value, [segment]: segment === "year" ? String(next) : String(next).padStart(2, "0") })
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const parts = event.clipboardData.getData("text").match(/\d+/g)
    if (!parts || parts.length < 2) return
    event.preventDefault()
    onChange({
      day: parts[0].slice(0, 2).padStart(2, "0"),
      month: parts[1].slice(0, 2).padStart(2, "0"),
      year: (parts[2] ?? "").slice(0, 4),
    })
    focusSegment(parts[2] ? "year" : "month", true)
  }

  const inputProps = (segment: Segment, label: string, placeholder: string) => ({
    ref: (node: HTMLInputElement | null) => {
      refs.current[segment] = node
    },
    value: value[segment],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => update(segment, event.target.value),
    onBlur: () => handleBlur(segment),
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => handleKeyDown(segment, event),
    onPaste: handlePaste,
    type: "text",
    inputMode: "numeric" as const,
    pattern: "[0-9]*",
    maxLength: segment === "year" ? 4 : 2,
    placeholder,
    "aria-label": label,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": error ? errorId : undefined,
    className: `birthday-segment ${segment === "year" ? "w-[6ch]" : "w-[4ch]"}`,
  })

  return (
    <div className="space-y-2">
      <p id={labelId} className="text-sm font-medium text-ink">
        Tu cumpleaños
      </p>
      <div role="group" aria-labelledby={labelId} className="birthday-field">
        <label className="birthday-part">
          <input {...inputProps("day", "Día", "DD")} />
          <span>día</span>
        </label>
        <label className="birthday-part">
          <input {...inputProps("month", "Mes", "MM")} />
          <span>mes</span>
        </label>
        <label className="birthday-part birthday-part-year">
          <input {...inputProps("year", "Año (opcional)", "AAAA")} />
          <span>año (opcional)</span>
        </label>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
