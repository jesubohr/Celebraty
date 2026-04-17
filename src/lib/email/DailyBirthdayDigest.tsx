import { Html, Head, Body, Container, Heading, Text, Section, Hr, Preview } from "@react-email/components"

interface BirthdayPerson {
  name: string
  birthYear?: number | null
}

interface Props {
  birthdays: BirthdayPerson[]
  year: number
}

export function DailyBirthdayDigest({ birthdays, year }: Props) {
  const single = birthdays.length === 1
  const preview = single
    ? `🎂 Hoy cumple años ${birthdays[0].name}!`
    : `🎂 Hoy cumplen años ${birthdays.length} amigos!`

  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#FAF6F1", fontFamily: "Georgia, serif", margin: 0 }}>
        <Container
          style={{
            maxWidth: 480,
            margin: "40px auto",
            padding: "32px 24px",
            backgroundColor: "#fff",
            borderRadius: 16,
            border: "1px solid #F0E8DF",
          }}
        >
          <Heading style={{ color: "#1F1B16", fontSize: 28, margin: "0 0 8px" }}>
            🎂 {single ? "Cumpleaños hoy" : `${birthdays.length} cumpleaños hoy`}
          </Heading>
          <Text style={{ color: "#9C7B6A", margin: "0 0 24px", fontSize: 14 }}>
            Recordatorio de tu círculo de amigos
          </Text>
          <Hr style={{ borderColor: "#F0E8DF", margin: "0 0 24px" }} />
          {birthdays.map((p) => {
            const age = p.birthYear ? year - p.birthYear : null
            return (
              <Section key={p.name} style={{ marginBottom: 16 }}>
                <Text style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#1F1B16" }}>{p.name}</Text>
                {age !== null && (
                  <Text style={{ margin: "2px 0 0", fontSize: 13, color: "#9C7B6A" }}>Cumple {age} años 🥳</Text>
                )}
              </Section>
            )
          })}
          <Hr style={{ borderColor: "#F0E8DF", margin: "24px 0 16px" }} />
          <Text style={{ fontSize: 12, color: "#C8B4A6", margin: 0 }}>
            Este recordatorio llegó porque estás registrado en el círculo. Para salir, simplemente contacta a quien te
            compartió el link.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
