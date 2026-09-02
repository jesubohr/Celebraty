interface ThemeColor {
  css: string
  hex: `#${string}`
}

function color(css: string, hex: `#${string}`): ThemeColor {
  return { css, hex }
}

export const palette = {
  light: {
    ground: color("oklch(0.975 0.008 73.745)", "#FAF6F1"),
    surface: color("oklch(0.995 0.003 48.72)", "#FFFDFC"),
    field: color("oklch(1 0 0)", "#FFFFFF"),
    ink: color("oklch(0.225 0.011 73.349)", "#1F1B16"),
    inkMuted: color("oklch(0.512 0.046 49.358)", "#7D5F4F"),
    line: color("oklch(0.893 0.022 63.179)", "#E7D9CD"),
    lineStrong: color("oklch(0.625 0.048 50.87)", "#A0806E"),
    ember: color("oklch(0.713 0.131 33.718)", "#E8826B"),
    emberInk: color("oklch(0.225 0.011 73.349)", "#1F1B16"),
    emberStrong: color("oklch(0.548 0.151 34.101)", "#B8482F"),
    danger: color("oklch(0.477 0.147 28.526)", "#9F3128"),
    focus: color("oklch(0.548 0.151 34.101)", "#B8482F"),
  },
  dark: {
    ground: color("oklch(0.187 0.01 52.826)", "#17120F"),
    surface: color("oklch(0.225 0.013 51.474)", "#211A16"),
    field: color("oklch(0.27 0.018 50)", "#2C211C"),
    ink: color("oklch(0.985 0.011 71.902)", "#FFF9F2"),
    inkMuted: color("oklch(0.813 0.034 49.265)", "#D5BCAF"),
    line: color("oklch(0.347 0.025 49.555)", "#45362E"),
    lineStrong: color("oklch(0.569 0.044 50.364)", "#8D7060"),
    ember: color("oklch(0.747 0.109 33.817)", "#E9937F"),
    emberInk: color("oklch(0.225 0.011 73.349)", "#1F1B16"),
    emberStrong: color("oklch(0.548 0.151 34.101)", "#B8482F"),
    danger: color("oklch(0.837 0.09 30.043)", "#FFB4A7"),
    focus: color("oklch(0.747 0.109 33.817)", "#E9937F"),
  },
} as const

type Appearance = keyof typeof palette

const CSS_NAMES = {
  ground: "ground",
  surface: "surface",
  field: "field",
  ink: "ink",
  inkMuted: "ink-muted",
  line: "line",
  lineStrong: "line-strong",
  ember: "ember",
  emberInk: "ember-ink",
  emberStrong: "ember-strong",
  danger: "danger",
  focus: "focus-ring",
} as const

function renderVariables(appearance: Appearance): string {
  const colors = palette[appearance]
  return Object.entries(CSS_NAMES)
    .map(([key, cssName]) => `--${cssName}:${colors[key as keyof typeof colors].css}`)
    .join(";")
}

export const themeCss = `
:root{color-scheme:light;${renderVariables("light")};--shadow-card:0 1px 2px oklch(0.35 0.03 55 / 0.08),0 18px 45px oklch(0.35 0.03 55 / 0.09)}
@media (prefers-color-scheme: dark){:root{color-scheme:dark;${renderVariables("dark")};--shadow-card:0 0 0 1px oklch(1 0 0 / 0.08),0 18px 45px oklch(0 0 0 / 0.28)}}
`.trim()

export const emailFontFamily = "Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"

const emailDark = palette.dark
export const emailDarkModeCss = `@media(prefers-color-scheme:dark){.email-body{background-color:${emailDark.ground.hex}!important}.email-card{background-color:${emailDark.surface.hex}!important;border-color:${emailDark.line.hex}!important}.email-ink{color:${emailDark.ink.hex}!important}.email-muted{color:${emailDark.inkMuted.hex}!important}.email-line{border-color:${emailDark.line.hex}!important}}`
