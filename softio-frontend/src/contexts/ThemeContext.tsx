import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"

type Theme = "light" | "dark"
type ColorTheme = "navy" | "teal" | "rose" | "violet"

interface ThemeContextType {
  theme: Theme
  colorTheme: ColorTheme
  setTheme: (theme: Theme) => void
  setColorTheme: (color: ColorTheme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const colorThemes = {
  navy: {
    light: { primary: "222 47% 28%", primaryForeground: "0 0% 100%" },
    dark:  { primary: "213 42% 55%", primaryForeground: "222 47% 10%" },
  },
  teal: {
    light: { primary: "175 55% 28%", primaryForeground: "0 0% 100%" },
    dark:  { primary: "172 45% 42%", primaryForeground: "175 50% 8%" },
  },
  rose: {
    light: { primary: "340 45% 42%", primaryForeground: "0 0% 100%" },
    dark:  { primary: "340 40% 58%", primaryForeground: "340 30% 10%" },
  },
  violet: {
    light: { primary: "265 40% 42%", primaryForeground: "0 0% 100%" },
    dark:  { primary: "265 35% 58%", primaryForeground: "265 30% 10%" },
  },
}

const baseThemes = {
  light: {
    background: "0 0% 100%",
    foreground: "222 47% 11%",
    card: "0 0% 100%",
    cardForeground: "222 47% 11%",
    muted: "210 40% 96%",
    mutedForeground: "215 16% 47%",
    accent: "210 40% 96%",
    accentForeground: "222 47% 11%",
    border: "214 32% 91%",
    secondary: "210 40% 96%",
    secondaryForeground: "222 47% 11%",
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

const validColors: ColorTheme[] = ["navy", "teal", "rose", "violet"]

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) || "light"
  })

  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem("colorTheme") as ColorTheme
    return validColors.includes(saved) ? saved : "navy"
  })

  useEffect(() => {
    const root = document.documentElement
    const safeColor = validColors.includes(colorTheme) ? colorTheme : "navy"
    const primary = colorThemes[safeColor][theme]
    const base = baseThemes[theme]

    root.style.setProperty("--primary", primary.primary)
    root.style.setProperty("--primary-foreground", primary.primaryForeground)

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
    localStorage.setItem("colorTheme", safeColor)
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