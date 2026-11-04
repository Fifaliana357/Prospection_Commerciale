export type ColorTheme = "emerald" | "ocean" | "violet" | "sun" | "slate"

export const colorThemeOptions: Array<{
  value: ColorTheme
  name: string
  description: string
  hex: string
  light: { primary: string; foreground: string }
  dark: { primary: string; foreground: string }
}> = [
  {
    value: "emerald",
    name: "Émeraude",
    description: "Une signature naturelle et équilibrée.",
    hex: "#047857",
    light: { primary: "158 94% 27%", foreground: "0 0% 100%" },
    dark: { primary: "158 64% 48%", foreground: "160 50% 8%" },
  },
  {
    value: "ocean",
    name: "Océan",
    description: "Une nuance profonde et posée.",
    hex: "#1d4ed8",
    light: { primary: "224 76% 48%", foreground: "0 0% 100%" },
    dark: { primary: "213 92% 63%", foreground: "222 47% 10%" },
  },
  {
    value: "violet",
    name: "Violet",
    description: "Une touche distincte, sans surcharge.",
    hex: "#6d28d9",
    light: { primary: "262 70% 48%", foreground: "0 0% 100%" },
    dark: { primary: "263 70% 65%", foreground: "263 35% 10%" },
  },
  {
    value: "sun",
    name: "Soleil",
    description: "Une couleur chaude et énergique.",
    hex: "#c2410c",
    light: { primary: "20 91% 40%", foreground: "0 0% 100%" },
    dark: { primary: "25 95% 58%", foreground: "24 40% 10%" },
  },
  {
    value: "slate",
    name: "Ardoise",
    description: "Une option sobre et intemporelle.",
    hex: "#334155",
    light: { primary: "215 25% 27%", foreground: "0 0% 100%" },
    dark: { primary: "215 20% 65%", foreground: "222 47% 10%" },
  },
]

export function isColorTheme(value: string | null): value is ColorTheme {
  return colorThemeOptions.some((option) => option.value === value)
}
