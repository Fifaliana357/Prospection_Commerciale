import { Routes, Route, Navigate } from "react-router-dom"
import MainLayout from "./components/layout/MainLayout"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Clients from "./pages/Clients"
import Interets from "./pages/Interets"
import Closing from "./pages/Closing"
import RendezVous from "./pages/RendezVous"
import Ventes from "./pages/Ventes"
import Facturation from "./pages/Facturation"
import SAV from "./pages/SAV"
import Stock from "./pages/Stock"
import Commerciaux from "./pages/Commerciaux"
import Statistiques from "./pages/Statistiques"
import Bibliotheque from "./pages/Bibliotheque"
import Tutoriels from "./pages/Tutoriels"
import Prospects from "./pages/Prospects"
import Prospection from "./pages/Prospection"
import ProspectionDetail from "./pages/ProspectionDetail"
import ProspectionCreate from "./pages/ProspectionCreate"

const Bientot = () => (
  <div className="rounded-2xl border border-dashed border-border p-12 text-center">
    <h1 className="font-display text-2xl font-semibold">Page en cours de refonte</h1>
    <p className="mt-2 text-sm text-muted-foreground">Cette page sera reliée à l'API dans la prochaine étape.</p>
  </div>
)

const PrivateRoute = () => {
  const token = localStorage.getItem("@Softio:token")
  return token ? <MainLayout /> : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/statistiques" element={<Statistiques />} />
        <Route path="/prospects" element={<Prospects />} />
        <Route path="/prospections" element={<Prospection />} />
        <Route path="/prospections/create" element={<ProspectionCreate />} />
        <Route path="/prospections/:id" element={<ProspectionDetail />} />
        <Route path="/rendez-vous" element={<RendezVous />} />
        <Route path="/interets" element={<Interets />} />
        <Route path="/closing" element={<Closing />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/ventes" element={<Ventes />} />
        <Route path="/facturation" element={<Facturation />} />
        <Route path="/sav" element={<SAV />} />
        <Route path="/catalogue" element={<Bientot />} />
        <Route path="/produits" element={<Navigate to="/catalogue" replace />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/commerciaux" element={<Commerciaux />} />
        <Route path="/bibliotheque" element={<Bibliotheque />} />
        <Route path="/tutoriels" element={<Tutoriels />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

export default App
