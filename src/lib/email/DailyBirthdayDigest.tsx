import { Html, Head, Body, Container, Heading, Text, Section, Hr, Preview } from "react-email"
import { emailDarkModeCss, emailFontFamily, palette } from "@/lib/theme"

interface BirthdayPerson {
  name: string
  birthYear?: number | null
}

interface Props {
  birthdays: BirthdayPerson[]
  year: number
}

export function dailyBirthdaySubject(birthdays: readonly { name: string }[]) {
  return birthdays.length === 1
    ? `Hoy cumple años ${birthdays[0].name}`
    : `Hoy cumplen años ${birthdays.length} amigos`
}

export function DailyBirthdayDigest({ birthdays, year }: Props) {
  const single = birthdays.length === 1
  const preview = dailyBirthdaySubject(birthdays)
  const light = palette.light

  return (
    <Html lang="es">
      <Head>
        <style>{emailDarkModeCss}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body className="email-body" style={{ backgroundColor: light.ground.hex, fontFamily: emailFontFamily, margin: 0 }}>
        <Container
          className="email-card"
          style={{
            maxWidth: 480,
            margin: "40px auto",
            padding: "32px 24px",
            backgroundColor: light.surface.hex,
            borderRadius: 16,
            border: `1px solid ${light.line.hex}`,
          }}
        >
          <Heading className="email-ink" style={{ color: light.ink.hex, fontSize: 28, margin: "0 0 8px" }}>
            {single ? "Cumpleaños hoy" : `${birthdays.length} cumpleaños hoy`}
          </Heading>
          <Text className="email-muted" style={{ color: light.inkMuted.hex, margin: "0 0 24px", fontSize: 14 }}>
            Recordatorio de tu círculo de amigos
          </Text>
          <Hr className="email-line" style={{ borderColor: light.line.hex, margin: "0 0 24px" }} />
          {birthdays.map((p) => {
            const age = p.birthYear ? year - p.birthYear : null
            return (
              <Section key={p.name} style={{ marginBottom: 16 }}>
                <Text className="email-ink" style={{ margin: 0, fontSize: 18, fontWeight: 600, color: light.ink.hex }}>
                  {p.name}
                </Text>
                {age !== null && (
                  <Text
                    className="email-muted"
                    style={{ margin: "2px 0 0", fontSize: 14, color: light.inkMuted.hex, fontVariantNumeric: "tabular-nums" }}
                  >
                    Cumple <span style={{ fontSize: 24, fontWeight: 700 }}>{age}</span> años
                  </Text>
                )}
              </Section>
            )
          })}
          <Hr className="email-line" style={{ borderColor: light.line.hex, margin: "24px 0 16px" }} />
          <Text className="email-muted" style={{ fontSize: 12, color: light.inkMuted.hex, margin: 0 }}>
            Este recordatorio llegó porque estás registrado en el círculo. Para salir, simplemente contacta a quien te
            compartió el link.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
