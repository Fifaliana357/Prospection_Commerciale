export interface SessionUser {
  nom: string
  email: string
  initiale: string
  role: "admin" | "commercial"
}

function storedUser(): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem("@Softio:user") || "{}")
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {}
  } catch {
    return {}
  }
}

export function getSessionUser(): SessionUser {
  const raw = storedUser()
  const nom: string =
    [raw.prenom, raw.nom].filter(Boolean).join(" ") || raw.name || raw.email || "Utilisateur"
  const type = localStorage.getItem("@Softio:type")
  return {
    nom,
    email: raw.email || "",
    initiale: nom.trim().charAt(0).toUpperCase() || "U",
    role: type === "commercial" ? "commercial" : "admin",
  }
}

export function updateSessionProfile(profile: { nom: string; prenom: string; email: string }) {
  const current = storedUser()
  localStorage.setItem("@Softio:user", JSON.stringify({ ...current, ...profile }))
  window.dispatchEvent(new Event("softio:profile-updated"))
}

export function logout() {
  localStorage.removeItem("@Softio:token")
  localStorage.removeItem("@Softio:user")
  localStorage.removeItem("@Softio:type")
  window.location.href = "/login"
}
