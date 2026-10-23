import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"

type Theme = "light" | "dark"
type ColorTheme = "emerald" | "ocean" | "violet" | "sunset" | "slate"

interface ThemeContextType {
  theme: Theme
  colorTheme: ColorTheme
  setTheme: (theme: Theme) => void
  setColorTheme: (color: ColorTheme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const colorThemes = {
  emerald: {
    light: { primary: "160 84% 39%", primaryForeground: "0 0% 100%" },
    dark: { primary: "160 84% 45%", primaryForeground: "0 0% 100%" },
  },
  ocean: {
    light: { primary: "221 83% 53%", primaryForeground: "0 0% 100%" },
    dark: { primary: "217 91% 60%", primaryForeground: "0 0% 100%" },
  },
  violet: {
    light: { primary: "262 83% 58%", primaryForeground: "0 0% 100%" },
    dark: { primary: "263 70% 65%", primaryForeground: "0 0% 100%" },
  },
  sunset: {
    light: { primary: "24 95% 53%", primaryForeground: "0 0% 100%" },
    dark: { primary: "27 96% 61%", primaryForeground: "0 0% 100%" },
  },
  slate: {
    light: { primary: "215 25% 27%", primaryForeground: "0 0% 100%" },
    dark: { primary: "215 20% 65%", primaryForeground: "0 0% 10%" },
  },
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) || "light"
  })

  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    return (localStorage.getItem("colorTheme") as ColorTheme) || "emerald"
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)

    const colors = colorThemes[colorTheme][theme]

    root.style.setProperty("--primary", colors.primary)
    root.style.setProperty("--primary-foreground", colors.primaryForeground)

    if (theme === "light") {
      root.style.setProperty("--background", "210 40% 98%")
      root.style.setProperty("--sidebar", "0 0% 100%")
      root.style.setProperty("--foreground", "222 47% 11%")
      root.style.setProperty("--card", "0 0% 100%")
      root.style.setProperty("--card-foreground", "222 47% 11%")
      root.style.setProperty("--popover", "0 0% 100%")
      root.style.setProperty("--popover-foreground", "222 47% 11%")
      root.style.setProperty("--secondary", "210 40% 96%")
      root.style.setProperty("--secondary-foreground", "222 47% 11%")
      root.style.setProperty("--muted", "210 40% 96%")
      root.style.setProperty("--muted-foreground", "215 16% 47%")
      root.style.setProperty("--accent", "210 40% 96%")
      root.style.setProperty("--accent-foreground", "222 47% 11%")
      root.style.setProperty("--destructive", "0 84% 60%")
      root.style.setProperty("--destructive-foreground", "0 0% 100%")
      root.style.setProperty("--border", "214 32% 91%")
      root.style.setProperty("--input", "214 32% 91%")
      root.style.setProperty("--ring", colors.primary)
    } else {
      root.style.setProperty("--background", "222 47% 7%")
      root.style.setProperty("--sidebar", "222 47% 11%")
      root.style.setProperty("--foreground", "210 40% 98%")
      root.style.setProperty("--card", "222 47% 9%")
      root.style.setProperty("--card-foreground", "210 40% 98%")
      root.style.setProperty("--popover", "222 47% 9%")
      root.style.setProperty("--popover-foreground", "210 40% 98%")
      root.style.setProperty("--secondary", "217 33% 17%")
      root.style.setProperty("--secondary-foreground", "210 40% 98%")
      root.style.setProperty("--muted", "217 33% 17%")
      root.style.setProperty("--muted-foreground", "215 20% 65%")
      root.style.setProperty("--accent", "217 33% 17%")
      root.style.setProperty("--accent-foreground", "210 40% 98%")
      root.style.setProperty("--destructive", "0 62% 50%")
      root.style.setProperty("--destructive-foreground", "0 0% 100%")
      root.style.setProperty("--border", "217 33% 17%")
      root.style.setProperty("--input", "217 33% 17%")
      root.style.setProperty("--ring", colors.primary)
    }

    localStorage.setItem("theme", theme)
    localStorage.setItem("colorTheme", colorTheme)
  }, [theme, colorTheme])

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light")

  return (
    <ThemeContext.Provider value={{ theme, colorTheme, setTheme, setColorTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used within ThemeProvider")
  return context
}