import { hierarchy, pack } from "d3-hierarchy"
import { sortCountdowns, type BirthdayCountdown } from "@/lib/birthdays"

export const MIN_BUBBLE_RADIUS = 20
const CIRCLE_PADDING = 3
const MAX_SCORE = 100
const MIN_SCORE = 20
const DECAY_DAYS = 30

export interface BubbleNode {
  id: string
  displayName: string
  countdownLabel: string
  daysUntil: number
  x: number
  y: number
  r: number
}

export interface BubbleLayoutResult {
  nodes: BubbleNode[]
  width: number
  height: number
}

interface PackDatum {
  id: string
  displayName: string
  countdownLabel: string
  daysUntil: number
  value?: number
  children?: PackDatum[]
}

function closenessScore(daysUntil: number): number {
  return MIN_SCORE + (MAX_SCORE - MIN_SCORE) / (1 + daysUntil / DECAY_DAYS)
}

function packAt(countdowns: BirthdayCountdown[], width: number, height: number): BubbleNode[] {
  const root: PackDatum = {
    id: "root",
    displayName: "",
    countdownLabel: "",
    daysUntil: 0,
    children: countdowns.map((c) => ({ ...c, value: closenessScore(c.daysUntil) })),
  }

  const packLayout = pack<PackDatum>().size([width, height]).padding(CIRCLE_PADDING)
  const packed = packLayout(hierarchy(root).sum((d) => d.value ?? 0))

  return packed.leaves().map((leaf) => ({
    id: leaf.data.id,
    displayName: leaf.data.displayName,
    countdownLabel: leaf.data.countdownLabel,
    daysUntil: leaf.data.daysUntil,
    x: leaf.x,
    y: leaf.y,
    r: leaf.r,
  }))
}

export function layoutBirthdayBubbles(countdowns: BirthdayCountdown[], width: number): BubbleLayoutResult {
  if (countdowns.length === 0) {
    return { nodes: [], width, height: width }
  }

  const sorted = [...countdowns].sort(sortCountdowns)

  // d3.pack scales circles to fit min(width, height), so growing height only
  // helps up to height === width; beyond that a taller canvas can't enlarge circles.
  let height = Math.max(Math.round(width / 2), 1)
  let nodes = packAt(sorted, width, height)
  let minRadius = Math.min(...nodes.map((n) => n.r))

  while (minRadius < MIN_BUBBLE_RADIUS && height < width) {
    const scale = (MIN_BUBBLE_RADIUS / minRadius) ** 2
    height = Math.min(width, Math.ceil(height * scale))
    nodes = packAt(sorted, width, height)
    minRadius = Math.min(...nodes.map((n) => n.r))
  }

  return { nodes, width, height }
}
