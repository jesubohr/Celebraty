import { useLayoutEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"

import type { BirthdayCountdown } from "@/lib/birthdays"
import { layoutBirthdayBubbles, type BubbleNode } from "@/components/BirthdayBubbleChart/layout"

const PALETTE = ["var(--color-bubble-1)", "var(--color-bubble-2)", "var(--color-bubble-3)", "var(--color-bubble-4)", "var(--color-bubble-5)"]

interface Props {
  countdowns: BirthdayCountdown[]
  hasError?: boolean
}

export default function BirthdayBubbleChart({ countdowns, hasError }: Props) {
  const reduced = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setWidth(Math.round(entry.contentRect.width))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (hasError) {
    return (
      <p role="alert" className="text-center text-warm-muted text-sm py-6">
        No pudimos cargar el círculo. Actualiza la página para intentarlo de nuevo.
      </p>
    )
  }

  if (countdowns.length === 0) {
    return (
      <p className="text-center text-warm-muted text-sm py-6">Todavía no hay nadie registrado. ¡Sé el primero! 🌱</p>
    )
  }

  const { nodes, width: chartWidth, height } = width ? layoutBirthdayBubbles(countdowns, width) : { nodes: [], width: 0, height: 0 }

  return (
    <div ref={containerRef} className="w-full">
      {width && (
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          width="100%"
          height={height}
          role="presentation"
          aria-hidden="true"
          className="block"
        >
          {nodes.map((node, i) => (
            <Bubble key={node.id} node={node} color={PALETTE[i % PALETTE.length]} index={i} reduced={!!reduced} />
          ))}
        </svg>
      )}

      <ol className="sr-only">
        {countdowns.map((c) => (
          <li key={c.id}>
            {c.displayName}: {c.countdownLabel === "Hoy" ? "cumple hoy" : `faltan ${c.countdownLabel}`}
          </li>
        ))}
      </ol>
    </div>
  )
}

function Bubble({
  node,
  color,
  index,
  reduced,
}: {
  node: BubbleNode
  color: string
  index: number
  reduced: boolean
}) {
  const nameFontSize = clamp(node.r * 0.26, 8, 13)
  const labelFontSize = clamp(node.r * 0.22, 7, 11)

  return (
    <motion.g
      initial={reduced ? false : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 22, delay: index * 0.02 }}
      style={{ transformOrigin: `${node.x}px ${node.y}px` }}
    >
      <circle cx={node.x} cy={node.y} r={node.r} fill={color} />
      <text
        x={node.x}
        y={node.y - node.r * 0.12}
        textAnchor="middle"
        fontSize={nameFontSize}
        fontWeight={600}
        fill="var(--color-warm-dark)"
      >
        {node.displayName}
      </text>
      <text
        x={node.x}
        y={node.y + node.r * 0.32}
        textAnchor="middle"
        fontSize={labelFontSize}
        fill="var(--color-warm-muted)"
      >
        {node.countdownLabel}
      </text>
    </motion.g>
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
