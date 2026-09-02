import { describe, expect, it } from "vitest"

import { palette, themeCss } from "@/lib/theme"

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrast(foreground: string, background: string) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

describe.each(["light", "dark"] as const)("%s palette", (appearance) => {
  const colors = palette[appearance]

  it.each([
    ["ink on ground", colors.ink.hex, colors.ground.hex],
    ["muted ink on ground", colors.inkMuted.hex, colors.ground.hex],
    ["muted ink on surface", colors.inkMuted.hex, colors.surface.hex],
    ["ink on ember", colors.emberInk.hex, colors.ember.hex],
    ["white on strong ember", "#FFFFFF", colors.emberStrong.hex],
    ["danger on ground", colors.danger.hex, colors.ground.hex],
    ["danger on surface", colors.danger.hex, colors.surface.hex],
  ])("keeps %s at WCAG AA", (_name, foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5)
  })
})

it("emits graphic tokens for both appearances", () => {
  expect(themeCss).toContain(":root")
  expect(themeCss).toContain("@media (prefers-color-scheme: dark)")
  expect(themeCss).toContain("--line-strong:")
  expect(themeCss).toContain("--ember:")
})
