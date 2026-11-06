export interface SessionUser {
  nom: string
  email: string
  initiale: string
  role: "admin" | "commercial"
}

function storedUser(): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem("@Softio:user") || "{}")
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {}
  } catch {
    return {}
  }
}

function storedString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

export function getSessionUser(): SessionUser {
  const raw = storedUser()
  const nom =
    [storedString(raw.prenom), storedString(raw.nom)].filter(Boolean).join(" ")
    || storedString(raw.name)
    || storedString(raw.email)
    || "Utilisateur"
  const type = sessionStorage.getItem("@Softio:type")
  return {
    nom,
    email: storedString(raw.email),
    initiale: nom.trim().charAt(0).toUpperCase() || "U",
    role: type === "commercial" ? "commercial" : "admin",
  }
}

export function updateSessionProfile(profile: { nom: string; prenom: string; email: string }) {
  const current = storedUser()
  sessionStorage.setItem("@Softio:user", JSON.stringify({ ...current, ...profile }))
  window.dispatchEvent(new Event("softio:profile-updated"))
}

export function logout() {
  sessionStorage.removeItem("@Softio:token")
  sessionStorage.removeItem("@Softio:user")
  sessionStorage.removeItem("@Softio:type")
  window.location.href = "/login"
}
