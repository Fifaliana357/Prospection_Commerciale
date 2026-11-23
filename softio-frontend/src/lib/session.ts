import { retournerVersSoftio } from "./softio"

export interface SessionUser {
  nom: string
  email: string
  initiale: string
  role: "admin" | "commercial"
  isFirstLogin: boolean
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
    isFirstLogin: raw.is_first_login === true,
  }
}

export function updateSessionProfile(profile: { nom: string; prenom: string; email: string }) {
  const current = storedUser()
  sessionStorage.setItem("@Softio:user", JSON.stringify({ ...current, ...profile }))
  window.dispatchEvent(new Event("softio:profile-updated"))
}

export function logout() {
  const fromSoftio = sessionStorage.getItem("@Softio:fromSoftio") === "1"
  sessionStorage.removeItem("@Softio:token")
  sessionStorage.removeItem("@Softio:user")
  sessionStorage.removeItem("@Softio:type")
  sessionStorage.removeItem("@Softio:fromSoftio")

  if (fromSoftio) {
    retournerVersSoftio()
    return
  }

  window.location.href = "/login"
}
