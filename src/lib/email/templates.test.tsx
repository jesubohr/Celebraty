import { render } from "react-email"
import { describe, expect, it } from "vitest"

import { DailyBirthdayDigest, dailyBirthdaySubject } from "@/lib/email/DailyBirthdayDigest"
import { LoginLink } from "@/lib/email/LoginLink"
import { palette } from "@/lib/theme"

describe("email templates", () => {
  it("keeps digest subjects specific and free of decorative emoji", () => {
    expect(dailyBirthdaySubject([{ name: "Ana" }])).toBe("Hoy cumple años Ana")
    expect(dailyBirthdaySubject([{ name: "Ana" }, { name: "Luis" }])).toBe("Hoy cumplen años 2 amigos")
  })

  it("renders the digest from shared colors without decorative emoji or serif type", async () => {
    const html = await render(<DailyBirthdayDigest birthdays={[{ name: "Ana", birthYear: 1998 }]} year={2026} />)

    expect(html).toContain(palette.light.ground.hex)
    expect(html).toContain(palette.light.inkMuted.hex)
    expect(html).not.toContain("Georgia")
    expect(html).not.toMatch(/[🎂🥳🎉📬🌱]/u)
  })

  it("renders a three-birthday digest with the large numeral treatment", async () => {
    const html = await render(
      <DailyBirthdayDigest
        birthdays={[
          { name: "Ana", birthYear: 1998 },
          { name: "Luis", birthYear: 1989 },
          { name: "Mara", birthYear: null },
        ]}
        year={2026}
      />,
    )

    expect(html).toContain("font-size:24px")
    expect(html).toContain("Ana")
    expect(html).toContain("Luis")
    expect(html).toContain("Mara")
    expect(html).toContain("prefers-color-scheme:dark")
  })

  it("uses strong ember for the login action and includes dark appearance styles", async () => {
    const html = await render(<LoginLink loginUrl="https://celebraty.test/login" />)

    expect(html).toContain(palette.light.emberStrong.hex)
    expect(html).toContain("prefers-color-scheme:dark")
    expect(html).toContain(`border-color:${palette.dark.line.hex}!important`)
    expect(html).not.toContain("Georgia")
    expect(html).not.toMatch(/[🎂🥳🎉📬🌱]/u)
  })
})
