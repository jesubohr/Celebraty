import { motion } from "motion/react"

interface UpcomingFriend {
  name: string
  birthMonth: number
  birthDay: number
  daysUntil: number
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

const spring = { type: "spring" as const, stiffness: 300, damping: 30 }

export default function UpcomingList({ upcoming }: { upcoming: UpcomingFriend[] }) {
  if (upcoming.length === 0) {
    return (
      <p className="text-center text-warm-muted text-sm py-6">Todavía no hay nadie registrado. ¡Sé el primero! 🌱</p>
    )
  }

  return (
    <ul className="space-y-2">
      {upcoming.map((f, i) => (
        <motion.li
          key={f.name + f.birthMonth + f.birthDay}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: i * 0.04 }}
          className="flex items-center justify-between px-4 py-3 rounded-2xl bg-warm-bg border border-warm-border"
        >
          <div>
            <p className="font-medium text-warm-dark text-sm">{f.name}</p>
            <p className="text-xs text-warm-muted">
              {f.birthDay} {MONTHS[f.birthMonth - 1]}
            </p>
          </div>
          <span className={`pill ${f.daysUntil === 0 ? "pill-today" : "pill-soon"}`}>
            {f.daysUntil === 0 ? "🎂 Hoy!" : `en ${f.daysUntil}d`}
          </span>
        </motion.li>
      ))}
    </ul>
  )
}
