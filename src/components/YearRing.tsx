import { getDayOfYear, getDaysInYear } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { motion, useReducedMotion } from "motion/react"
import { useEffect, useMemo, useState } from "react"

import { BOGOTA_TZ, sortCountdowns, type BirthdayCountdown } from "@/lib/birthdays"
import { getDateAngle, layoutBirthdayDots, pointOnRing } from "@/lib/year"

const CENTER = 160
const RING_RADIUS = 112
const LABEL_RADIUS = 142
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
const RING_EASE = [0.23, 1, 0.32, 1] as const
const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" })

function getDotTransition(reducedMotion: boolean | null, isNew: boolean, index: number) {
  if (reducedMotion) return { duration: 0 }
  if (isNew) return { type: "spring" as const, duration: 0.55, bounce: 0.2 }
  return { duration: 0.25, delay: index * 0.04, ease: RING_EASE }
}

interface Props {
  countdowns: BirthdayCountdown[]
  hasError?: boolean
  today?: Date
}

export default function YearRing({ countdowns, hasError = false, today = new Date() }: Props) {
  const reducedMotion = useReducedMotion()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [registered, setRegistered] = useState<BirthdayCountdown[]>([])
  const bogotaToday = toZonedTime(today, BOGOTA_TZ)
  const year = bogotaToday.getFullYear()

  useEffect(() => {
    const addRegisteredBirthday = (event: Event) => {
      const birthday = (event as CustomEvent<BirthdayCountdown>).detail
      setRegistered((current) => [...current.filter(({ id }) => id !== birthday.id), birthday])
    }
    window.addEventListener("celebraty:registered", addRegisteredBirthday)
    return () => window.removeEventListener("celebraty:registered", addRegisteredBirthday)
  }, [])

  const birthdays = useMemo(() => [...countdowns, ...registered].sort(sortCountdowns), [countdowns, registered])
  const dots = layoutBirthdayDots(birthdays, year)
  const dotById = new Map(dots.map((dot) => [dot.id, dot]))
  const registeredIds = new Set(registered.map(({ id }) => id))
  const daysInYear = getDaysInYear(bogotaToday)
  const dayOfYear = getDayOfYear(bogotaToday)
  const arcLength = (30 / daysInYear) * CIRCUMFERENCE
  const todayPoint = pointOnRing(((dayOfYear - 1) / daysInYear) * 360, RING_RADIUS)
  const dateLabel = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long" }).format(bogotaToday)

  return (
    <section className="year-ring" aria-labelledby={!hasError && birthdays.length > 0 ? "upcoming-heading" : undefined}>
      <div className="year-ring-graphic">
        <svg viewBox="0 0 320 320" aria-hidden="true" focusable="false" className="block size-full overflow-visible">
          <motion.circle
            data-ring-track
            cx={CENTER}
            cy={CENTER}
            r={RING_RADIUS}
            fill="none"
            stroke="var(--line)"
            strokeWidth="2"
            pathLength={1}
            initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.6, ease: RING_EASE }}
          />

          <motion.circle
            data-window-arc
            cx={CENTER}
            cy={CENTER}
            r={RING_RADIUS}
            fill="none"
            stroke="var(--ember)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${CIRCUMFERENCE - arcLength}`}
            strokeDashoffset={-((dayOfYear - 1) / daysInYear) * CIRCUMFERENCE}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.25, delay: 0.35 }}
          />

          {MONTHS.map((month, index) => {
            const angle = getDateAngle(index + 1, 1, year)
            const tickStart = pointOnRing(angle, RING_RADIUS - 5)
            const tickEnd = pointOnRing(angle, RING_RADIUS + 5)
            const label = pointOnRing(angle, LABEL_RADIUS)
            return (
              <g key={month}>
                <line x1={tickStart.x} y1={tickStart.y} x2={tickEnd.x} y2={tickEnd.y} stroke="var(--line-strong)" />
                <text
                  data-month-tick
                  x={label.x}
                  y={label.y}
                  dy="0.35em"
                  textAnchor="middle"
                  fill="var(--ink-muted)"
                  fontSize="12"
                  fontWeight="600"
                  letterSpacing="0.08em"
                >
                  {month}
                </text>
              </g>
            )
          })}

          <circle
            data-today-marker
            cx={todayPoint.x}
            cy={todayPoint.y}
            r="5"
            fill="var(--surface)"
            stroke="var(--ember-strong)"
            strokeWidth="3"
          />

          {birthdays.map((birthday, index) => {
            const dot = dotById.get(birthday.id)
            if (!dot) return null
            const active = activeId === birthday.id
            const isNew = registeredIds.has(birthday.id)
            return (
              <motion.circle
                key={birthday.id}
                data-birthday-dot={birthday.id}
                data-active={String(active)}
                cx={dot.x}
                cy={dot.y}
                r="6"
                fill={active ? "var(--ember-strong)" : "var(--ember)"}
                stroke="var(--surface)"
                strokeWidth="3"
                initial={reducedMotion ? false : { opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: active ? 1.45 : 1 }}
                transition={getDotTransition(reducedMotion, isNew, index)}
                style={{ transformOrigin: `${dot.x}px ${dot.y}px` }}
              />
            )
          })}

          <text x={CENTER} y="148" textAnchor="middle" fill="var(--ink-muted)" fontSize="13" fontWeight="600">
            HOY
          </text>
          <text
            x={CENTER}
            y="174"
            textAnchor="middle"
            fill="var(--ink)"
            fontSize="21"
            fontWeight="700"
            letterSpacing="-0.02em"
          >
            {dateLabel}
          </text>
          <text x={CENTER} y="196" textAnchor="middle" fill="var(--ink-muted)" fontSize="13">
            {birthdays.length === 1 ? "1 cumpleaños" : `${birthdays.length} cumpleaños`}
          </text>
        </svg>
      </div>

      {hasError ? (
        <p role="alert" className="py-4 text-center text-sm text-danger">
          No pudimos cargar el círculo. Actualiza la página para intentarlo de nuevo.
        </p>
      ) : birthdays.length === 0 ? (
        <p className="mx-auto max-w-xs text-center text-sm text-ink-muted">
          Nadie en el círculo todavía. Sé el primer punto del año.
        </p>
      ) : (
        <div className="space-y-3">
          <h2 id="upcoming-heading" className="text-lg font-semibold tracking-[-0.01em] text-ink">
            Próximos cumpleaños
          </h2>
          <ol className="space-y-2">
            {birthdays.map((birthday) => {
              const active = activeId === birthday.id
              const date = SHORT_DATE_FORMATTER.format(new Date(year, birthday.birthMonth - 1, birthday.birthDay))
              return (
                <motion.li
                  key={birthday.id}
                  tabIndex={0}
                  onMouseEnter={() => setActiveId(birthday.id)}
                  onMouseLeave={() => setActiveId(null)}
                  onFocus={() => setActiveId(birthday.id)}
                  onBlur={() => setActiveId(null)}
                  animate={reducedMotion ? undefined : { y: active ? -2 : 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="birthday-row"
                >
                  <span>
                    <span className="block font-semibold text-ink">{birthday.displayName}</span>
                    <span className="block text-sm text-ink-muted">{date}</span>
                  </span>
                  <span className={birthday.daysUntil === 0 ? "pill pill-today" : "pill pill-soon"}>
                    {birthday.countdownLabel}
                  </span>
                </motion.li>
              )
            })}
          </ol>
        </div>
      )}
    </section>
  )
}
