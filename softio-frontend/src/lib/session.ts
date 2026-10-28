export interface SessionUser {
  nom: string
  email: string
  initiale: string
  role: "admin" | "commercial"
}

export function getSessionUser(): SessionUser {
  let raw: any = {}
  try {
    raw = JSON.parse(localStorage.getItem("@Softio:user") || "{}")
  } catch {
    raw = {}
  }
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

export function logout() {
  localStorage.removeItem("@Softio:token")
  localStorage.removeItem("@Softio:user")
  localStorage.removeItem("@Softio:type")
  window.location.href = "/login"
}
