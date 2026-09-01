import { describe, expect, it } from "vitest"
import { layoutBirthdayBubbles, MIN_BUBBLE_RADIUS } from "@/components/BirthdayBubbleChart/layout"
import { getBirthdayCountdowns, type BirthdaySource } from "@/lib/birthdays"

const NOW = new Date("2026-06-15T17:00:00.000Z")
const WIDTH = 360

// Spreads birthdays realistically across up to ~300 days out, like a real
// friend circle, instead of clustering them in one narrow window.
function makeSources(count: number): BirthdaySource[] {
  if (count === 0) return []

  return Array.from({ length: count }, (_, i) => {
    const offsetDays = count === 1 ? 0 : Math.round((i * 300) / (count - 1))
    const date = new Date(NOW.getTime() + offsetDays * 86400000)
    return {
      id: `friend-${i}`,
      name: `Friend Número ${i}`,
      birthMonth: date.getUTCMonth() + 1,
      birthDay: date.getUTCDate(),
    }
  })
}

function assertNoOverlap(nodes: { x: number; y: number; r: number }[]) {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x
      const dy = nodes[i].y - nodes[j].y
      const distance = Math.sqrt(dx * dx + dy * dy)
      expect(distance).toBeGreaterThanOrEqual(nodes[i].r + nodes[j].r - 0.01)
    }
  }
}

function assertWithinBounds(nodes: { x: number; y: number; r: number }[], width: number, height: number) {
  for (const n of nodes) {
    expect(n.x - n.r).toBeGreaterThanOrEqual(-0.01)
    expect(n.x + n.r).toBeLessThanOrEqual(width + 0.01)
    expect(n.y - n.r).toBeGreaterThanOrEqual(-0.01)
    expect(n.y + n.r).toBeLessThanOrEqual(height + 0.01)
  }
}

describe.each([0, 1, 7, 25])("layoutBirthdayBubbles with %i members", (count) => {
  const countdowns = getBirthdayCountdowns(makeSources(count), NOW)

  it("produces one node per birthday", () => {
    const { nodes } = layoutBirthdayBubbles(countdowns, WIDTH)
    expect(nodes).toHaveLength(count)
  })

  if (count > 0) {
    it("keeps circles non-overlapping and within bounds", () => {
      const { nodes, width, height } = layoutBirthdayBubbles(countdowns, WIDTH)
      assertNoOverlap(nodes)
      assertWithinBounds(nodes, width, height)
    })

    it("meets the minimum readable radius by growing height", () => {
      const { nodes } = layoutBirthdayBubbles(countdowns, WIDTH)
      for (const n of nodes) {
        expect(n.r).toBeGreaterThanOrEqual(MIN_BUBBLE_RADIUS - 0.01)
      }
    })

    it("produces the same layout across repeated calls", () => {
      const first = layoutBirthdayBubbles(countdowns, WIDTH)
      const second = layoutBirthdayBubbles(countdowns, WIDTH)
      expect(second).toEqual(first)
    })
  }
})

describe("bubble size ordering", () => {
  it("gives earlier birthdays a radius at least as large as later ones", () => {
    const countdowns = getBirthdayCountdowns(makeSources(25), NOW)
    const { nodes } = layoutBirthdayBubbles(countdowns, WIDTH)

    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes.length; j++) {
        if (nodes[i].daysUntil < nodes[j].daysUntil) {
          expect(nodes[i].r).toBeGreaterThanOrEqual(nodes[j].r - 0.01)
        }
      }
    }
  })

  it("gives tied birthdays an equal, deterministic radius", () => {
    const tied: BirthdaySource[] = [
      { id: "a", name: "Ana Uno", birthMonth: 6, birthDay: 20 },
      { id: "b", name: "Ana Dos", birthMonth: 6, birthDay: 20 },
      { id: "c", name: "Ana Tres", birthMonth: 6, birthDay: 20 },
    ]
    const countdowns = getBirthdayCountdowns(tied, NOW)
    const { nodes } = layoutBirthdayBubbles(countdowns, WIDTH)

    expect(nodes[0].r).toBeCloseTo(nodes[1].r, 5)
    expect(nodes[1].r).toBeCloseTo(nodes[2].r, 5)
  })
})

describe("empty circle", () => {
  it("returns no nodes without erroring", () => {
    const { nodes, width, height } = layoutBirthdayBubbles([], WIDTH)
    expect(nodes).toEqual([])
    expect(width).toBe(WIDTH)
    expect(height).toBeGreaterThan(0)
  })
})
