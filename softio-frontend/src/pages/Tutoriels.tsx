import { Play } from "lucide-react"

const tutos = [
  { id: 1, titre: "Prise en main de Softio", duree: "8 min", description: "Découvrez les bases de l'application" },
  { id: 2, titre: "Gérer ses prospects efficacement", duree: "12 min", description: "Bonnes pratiques de prospection" },
  { id: 3, titre: "Créer une facture et un devis", duree: "6 min", description: "Tout savoir sur la facturation" },
  { id: 4, titre: "Suivre son stock", duree: "5 min", description: "Approvisionnement et inventaire" },
  { id: 5, titre: "Analyser ses statistiques", duree: "9 min", description: "Comprendre les indicateurs clés" },
]

export default function Tutoriels() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tutoriels</h1>
        <p className="text-muted-foreground text-sm mt-1">Formez-vous à l’utilisation de Softio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tutos.map((t) => (
          <div key={t.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
            <div className="h-36 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
              <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play size={24} fill="currentColor" />
              </div>
              <span className="absolute bottom-3 right-3 text-xs bg-background/80 backdrop-blur px-2 py-1 rounded">
                {t.duree}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold mb-1">{t.titre}</h3>
              <p className="text-sm text-muted-foreground">{t.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}