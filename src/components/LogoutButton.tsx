import { useState } from "react"

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.assign("/")
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="text-sm text-warm-muted hover:text-warm-dark transition-colors underline decoration-warm-border underline-offset-4 disabled:opacity-60 cursor-pointer"
    >
      {loading ? "Saliendo…" : "Cerrar sesión"}
    </button>
  )
}
