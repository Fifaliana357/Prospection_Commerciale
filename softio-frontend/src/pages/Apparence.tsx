import { Check, Moon, Palette, Sun } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import { colorThemeOptions } from "@/lib/theme"
import PageHeader from "@/components/ui/PageHeader"

export default function Apparence() {
  const { theme, setTheme, colorTheme, setColorTheme } = useTheme()

  return (
    <div className="space-y-7">
      <PageHeader title="Apparence" description="Choisissez un thème sobre et une couleur d’accent pour l’application." icon={<Palette size={23} />} />

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Mode d’affichage</h2>
            <p className="mt-1 text-sm text-muted-foreground">Adaptez les surfaces à votre environnement.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Clair</span>
            <Sun size={17} className={theme === "light" ? "text-primary" : "text-muted-foreground"} aria-hidden="true" />
            <button
              type="button"
              role="switch"
              aria-checked={theme === "dark"}
              aria-label={theme === "light" ? "Activer le thème sombre" : "Activer le thème clair"}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className={`relative inline-flex h-8 w-[58px] shrink-0 items-center rounded-full border transition-colors ${
                theme === "dark" ? "border-primary bg-primary" : "border-border bg-muted"
              }`}
            >
              <span className={`h-6 w-6 rounded-full bg-card shadow-sm transition-transform ${
                theme === "dark" ? "translate-x-[29px]" : "translate-x-1"
              }`} />
            </button>
            <Moon size={17} className={theme === "dark" ? "text-primary" : "text-muted-foreground"} aria-hidden="true" />
            <span className="text-sm font-medium">Sombre</span>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="font-semibold">Couleur principale</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Les couleurs fonctionnelles des actions restent inchangées.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {colorThemeOptions.map((option) => {
            const selected = colorTheme === option.value
            return (
              <button
                type="button"
                key={option.value}
                onClick={() => setColorTheme(option.value)}
                aria-pressed={selected}
                className={`group rounded-2xl border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  selected ? "border-primary ring-2 ring-primary/15" : "border-border hover:border-primary/35"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 h-5 w-5 shrink-0 rounded-full ring-4 ring-background"
                    style={{ backgroundColor: option.hex }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{option.name}</span>
                      {selected && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                          <Check size={14} /> Sélectionné
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">{option.description}</span>
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-background p-3">
                  <span className="space-y-1.5">
                    <span className="block h-2 w-20 rounded-full bg-muted" />
                    <span className="block h-2 w-14 rounded-full bg-muted" />
                  </span>
                  <span
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: option.hex }}
                  >
                    Aperçu
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
