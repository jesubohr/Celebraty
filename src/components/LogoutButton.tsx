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
      className="min-h-11 cursor-pointer touch-manipulation text-sm font-medium text-ink-muted underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:text-ink disabled:cursor-wait disabled:opacity-60"
    >
      {loading ? "Saliendo…" : "Cerrar sesión"}
    </button>
  )
}
