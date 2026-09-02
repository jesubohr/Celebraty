import { Html, Head, Body, Container, Heading, Text, Section, Hr, Preview, Button } from "react-email"
import { emailDarkModeCss, emailFontFamily, palette } from "@/lib/theme"

interface Props {
  loginUrl: string
}

export function LoginLink({ loginUrl }: Props) {
  const light = palette.light

  return (
    <Html lang="es">
      <Head>
        <style>{emailDarkModeCss}</style>
      </Head>
      <Preview>Tu enlace para entrar a Celebraty</Preview>
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
            Entra a Celebraty
          </Heading>
          <Text className="email-muted" style={{ color: light.inkMuted.hex, margin: "0 0 24px", fontSize: 14 }}>
            Toca el botón para entrar. Este enlace vence en 15 minutos y solo funciona una vez.
          </Text>
          <Hr className="email-line" style={{ borderColor: light.line.hex, margin: "0 0 24px" }} />
          <Section style={{ textAlign: "center", margin: "0 0 24px" }}>
            <Button
              href={loginUrl}
              style={{
                backgroundColor: light.emberStrong.hex,
                color: light.field.hex,
                padding: "12px 24px",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Entrar al círculo
            </Button>
          </Section>
          <Hr className="email-line" style={{ borderColor: light.line.hex, margin: "24px 0 16px" }} />
          <Text className="email-muted" style={{ fontSize: 12, color: light.inkMuted.hex, margin: 0 }}>
            Si no pediste este enlace, puedes ignorar este correo.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
