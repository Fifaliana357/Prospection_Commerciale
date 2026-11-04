import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { colorThemeOptions, isColorTheme } from "@/lib/theme"
import type { ColorTheme } from "@/lib/theme"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  colorTheme: ColorTheme
  setTheme: (theme: Theme) => void
  setColorTheme: (color: ColorTheme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const baseThemes = {
  light: {
    background: "150 14% 96%",
    foreground: "164 28% 11%",
    card: "0 0% 100%",
    cardForeground: "164 28% 11%",
    muted: "150 12% 93%",
    mutedForeground: "160 8% 43%",
    accent: "150 14% 92%",
    accentForeground: "164 28% 11%",
    border: "150 12% 88%",
    secondary: "150 12% 93%",
    secondaryForeground: "164 28% 11%",
  },
  dark: {
    background: "222 47% 7%",
    foreground: "210 40% 98%",
    card: "222 47% 10%",
    cardForeground: "210 40% 98%",
    muted: "217 33% 14%",
    mutedForeground: "215 20% 65%",
    accent: "217 33% 14%",
    accentForeground: "210 40% 98%",
    border: "217 33% 16%",
    secondary: "217 33% 14%",
    secondaryForeground: "210 40% 98%",
  },
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) || "light"
  })

  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem("colorTheme")
    if (isColorTheme(saved)) return saved
    if (saved === "teal") return "ocean"
    if (saved === "rose") return "sun"
    if (saved === "violet") return "violet"
    return "emerald"
  })

  useEffect(() => {
    const root = document.documentElement
    const option = colorThemeOptions.find((item) => item.value === colorTheme) ?? colorThemeOptions[0]
    const primary = option[theme]
    const base = baseThemes[theme]

    root.style.setProperty("--primary", primary.primary)
    root.style.setProperty("--primary-foreground", primary.foreground)

    root.style.setProperty("--background", base.background)
    root.style.setProperty("--foreground", base.foreground)
    root.style.setProperty("--card", base.card)
    root.style.setProperty("--card-foreground", base.cardForeground)
    root.style.setProperty("--muted", base.muted)
    root.style.setProperty("--muted-foreground", base.mutedForeground)
    root.style.setProperty("--accent", base.accent)
    root.style.setProperty("--accent-foreground", base.accentForeground)
    root.style.setProperty("--border", base.border)
    root.style.setProperty("--secondary", base.secondary)
    root.style.setProperty("--secondary-foreground", base.secondaryForeground)

    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }

    localStorage.setItem("theme", theme)
    localStorage.setItem("colorTheme", option.value)
  }, [theme, colorTheme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"))
  }

  return (
    <ThemeContext.Provider
      value={{ theme, colorTheme, setTheme, setColorTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}