import { Routes, Route, Navigate } from "react-router-dom"
import MainLayout from "./components/layout/MainLayout"
import Dashboard from "./pages/Dashboard"
import Prospects from "./pages/Prospects"
import Prospection from "./pages/Prospection"
import RendezVous from "./pages/RendezVous"
import Interets from "./pages/Interets"
import Closing from "./pages/Closing"
import Ventes from "./pages/Ventes"
import Catalogue from "./pages/Catalogue"
import Stock from "./pages/Stock"
import Facturation from "./pages/Facturation"
import SAV from "./pages/SAV"
import Commerciaux from "./pages/Commerciaux"
import Statistiques from "./pages/Statistiques"
import Bibliotheque from "./pages/Bibliotheque"
import Tutoriels from "./pages/Tutoriels"
import { ToastProvider } from "./components/ui/Toast"

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/prospects" element={<Prospects />} />
          <Route path="/prospection" element={<Prospection />} />
          <Route path="/interets" element={<Interets />} />
          <Route path="/rendez-vous" element={<RendezVous />} />
          <Route path="/closing" element={<Closing />} />
          <Route path="/ventes" element={<Ventes />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/facturation" element={<Facturation />} />
          <Route path="/sav" element={<SAV />} />
          <Route path="/commerciaux" element={<Commerciaux />} />
          <Route path="/statistiques" element={<Statistiques />} />
          <Route path="/bibliotheque" element={<Bibliotheque />} />
          <Route path="/tutoriels" element={<Tutoriels />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}