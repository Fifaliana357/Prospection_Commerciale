import { TrendingUp, Users, ShoppingCart, Handshake } from "lucide-react"

const kpis = [
  { title: "Chiffre d'affaires", value: "42.8M MGA", change: "+18.7%", icon: TrendingUp, color: "bg-emerald-500/10 text-emerald-600" },
  { title: "Prospects convertis", value: "86", change: "+12%", icon: Users, color: "bg-blue-500/10 text-blue-600" },
  { title: "Ventes réalisées", value: "124", change: "+9.3%", icon: ShoppingCart, color: "bg-violet-500/10 text-violet-600" },
  { title: "Taux de closing", value: "34%", change: "+4.1%", icon: Handshake, color: "bg-orange-500/10 text-orange-600" },
]

export default function Statistiques() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Statistiques</h1>
        <p className="text-muted-foreground text-sm mt-1">Analysez vos performances commerciales</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="bg-card border border-border rounded-xl p-5">
            <div className={`w-10 h-10 rounded-lg ${kpi.color} flex items-center justify-center mb-4`}>
              <kpi.icon size={20} />
            </div>
            <p className="text-sm text-muted-foreground">{kpi.title}</p>
            <p className="text-2xl font-bold mt-1">{kpi.value}</p>
            <p className="text-xs text-emerald-600 mt-1">{kpi.change} vs mois dernier</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Évolution du CA</h2>
          <div className="h-56 flex items-end justify-between gap-3">
            {[35, 50, 40, 70, 55, 85, 65, 90].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-primary/80 rounded-t-md hover:bg-primary transition-all" style={{ height: `${h}%` }} />
                <span className="text-xs text-muted-foreground">{["Mar","Avr","Mai","Juin","Juil","Août","Sept","Oct"][i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Top produits</h2>
          <div className="space-y-4">
            {[
              { name: "Power Station 1000wh", ventes: 28, ca: "54.6M" },
              { name: "Power Station 300wh", ventes: 45, ca: "27.0M" },
              { name: "Speaker Champignon", ventes: 120, ca: "1.2M" },
              { name: "Speaker Standard", ventes: 85, ca: "1.5M" },
              { name: "Gourde Thermos", ventes: 60, ca: "0.66M" },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-sm font-medium">{p.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{p.ca}</p>
                  <p className="text-xs text-muted-foreground">{p.ventes} ventes</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}