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
import FacturationApercu from "./pages/FacturationApercu"
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
import Catalogue from './pages/Catalogue';
import CatalogueImpression from "./pages/CatalogueImpression"
import Notifications from './pages/Notifications'
import Profil from './pages/Profil'
import Entreprise from './pages/Entreprise'
import Comptabilite from './pages/Comptabilite'
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import EmailVerified from "./pages/EmailVerified"




const PrivateRoute = () => {
  const token = localStorage.getItem("@Softio:token")
  return token ? <MainLayout /> : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/email-verifie" element={<EmailVerified />} />

      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/entreprise" element={<Entreprise />} />
        <Route path="/comptabilite" element={<Comptabilite />} />
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
        <Route path="/facturation/:id/apercu" element={<FacturationApercu />} />
        <Route path="/sav" element={<SAV />} />
      
        <Route path="/produits" element={<Navigate to="/catalogue" replace />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/commerciaux" element={<Commerciaux />} />
        <Route path="/bibliotheque" element={<Bibliotheque />} />
        <Route path="/tutoriels" element={<Tutoriels />} />
        <Route path="/catalogue" element={<Catalogue />} />
        <Route path="/catalogue/impression" element={<CatalogueImpression />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

export default App
