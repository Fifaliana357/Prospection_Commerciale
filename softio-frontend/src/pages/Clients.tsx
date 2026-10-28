// src/pages/Clients.tsx
import { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Search } from 'lucide-react';

interface Client {
  id_client: number;
  nom: string;
  prenom: string;
  email: string;
  entreprise: string;
  type: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Formulaire
  const [showModal, setShowModal] = useState(false);
  const [newClient, setNewClient] = useState({
    matricule: 'CLI-' + Math.floor(Math.random() * 1000),
    type: 'particulier', nom: '', prenom: '', email: '', entreprise: ''
  });

  const fetchClients = async () => {
    try {
      // On passe le paramètre search à l'API
      const response = await api.get(`/clients?search=${search}`);
      setClients(response.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClients();
    }, 500); // Attendre 500ms après la dernière frappe pour chercher
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/clients', newClient);
      setShowModal(false);
      setNewClient({ matricule: 'CLI-' + Math.floor(Math.random() * 1000), type: 'particulier', nom: '', prenom: '', email: '', entreprise: '' });
      fetchClients();
    } catch (error) {
      alert("Erreur : Vérifie que le matricule n'est pas en double.");
    }
  };

  if (loading) return <div className="text-gray-500">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Clients</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
        >
          <Plus size={20} /> Nouveau Client
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Rechercher un client (nom, email, entreprise)..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tableau */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Nom</th>
              <th className="p-4 font-semibold text-gray-600">Entreprise</th>
              <th className="p-4 font-semibold text-gray-600">Email</th>
              <th className="p-4 font-semibold text-gray-600">Type</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id_client} className="hover:bg-gray-50 border-b last:border-0">
                <td className="p-4 font-medium text-gray-800">{client.nom} {client.prenom}</td>
                <td className="p-4 text-gray-600">{client.entreprise || '-'}</td>
                <td className="p-4 text-gray-600">{client.email || '-'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    client.type === 'entreprise' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {client.type}
                  </span>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">Aucun client trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modale de création */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Ajouter un Client</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Nom *" required
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newClient.nom} onChange={e => setNewClient({...newClient, nom: e.target.value})} />
                <input type="text" placeholder="Prénom"
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newClient.prenom} onChange={e => setNewClient({...newClient, prenom: e.target.value})} />
              </div>
              <input type="email" placeholder="Email"
                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
              <input type="text" placeholder="Entreprise"
                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={newClient.entreprise} onChange={e => setNewClient({...newClient, entreprise: e.target.value})} />
              <input type="text" placeholder="Matricule *" required
                className="w-full border p-2 rounded-lg bg-gray-50"
                value={newClient.matricule} onChange={e => setNewClient({...newClient, matricule: e.target.value})} />
              <select 
                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={newClient.type} onChange={e => setNewClient({...newClient, type: e.target.value})}>
                <option value="particulier">Particulier</option>
                <option value="entreprise">Entreprise</option>
              </select>
              
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Créer le client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}