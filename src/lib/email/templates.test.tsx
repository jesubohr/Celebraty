import { render } from "react-email"
import { describe, expect, it } from "vitest"

import { DailyBirthdayDigest } from "@/lib/email/DailyBirthdayDigest"
import { LoginLink } from "@/lib/email/LoginLink"
import { palette } from "@/lib/theme"

describe("email templates", () => {
  it("renders the digest from shared colors without decorative emoji or serif type", async () => {
    const html = await render(<DailyBirthdayDigest birthdays={[{ name: "Ana", birthYear: 1998 }]} year={2026} />)

    expect(html).toContain(palette.light.ground.hex)
    expect(html).toContain(palette.light.inkMuted.hex)
    expect(html).not.toContain("Georgia")
    expect(html).not.toMatch(/[🎂🥳🎉📬🌱]/u)
  })

  it("uses strong ember for the login action and includes dark appearance styles", async () => {
    const html = await render(<LoginLink loginUrl="https://celebraty.test/login" />)

    expect(html).toContain(palette.light.emberStrong.hex)
    expect(html).toContain("prefers-color-scheme:dark")
    expect(html).not.toContain("Georgia")
    expect(html).not.toMatch(/[🎂🥳🎉📬🌱]/u)
  })
})
