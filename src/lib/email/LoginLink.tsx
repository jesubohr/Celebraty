import { Html, Head, Body, Container, Heading, Text, Section, Hr, Preview, Button } from "react-email"

interface Props {
  loginUrl: string
}

export function LoginLink({ loginUrl }: Props) {
  return (
    <Html lang="es">
      <Head />
      <Preview>Tu enlace para entrar a Celebraty</Preview>
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
          <Heading style={{ color: "#1F1B16", fontSize: 28, margin: "0 0 8px" }}>🎂 Entra a Celebraty</Heading>
          <Text style={{ color: "#9C7B6A", margin: "0 0 24px", fontSize: 14 }}>
            Toca el botón para entrar. Este enlace vence en 15 minutos y solo funciona una vez.
          </Text>
          <Hr style={{ borderColor: "#F0E8DF", margin: "0 0 24px" }} />
          <Section style={{ textAlign: "center", margin: "0 0 24px" }}>
            <Button
              href={loginUrl}
              style={{
                backgroundColor: "#E8826B",
                color: "#fff",
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
          <Hr style={{ borderColor: "#F0E8DF", margin: "24px 0 16px" }} />
          <Text style={{ fontSize: 12, color: "#C8B4A6", margin: 0 }}>
            Si no pediste este enlace, puedes ignorar este correo.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
