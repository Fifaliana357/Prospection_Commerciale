<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClientController extends Controller
{
    public function buyers(Request $request)
    {
        $user = $request->user();
        $purchaseQuery = fn () => DB::table('vente')
            ->whereIn('vente.statut', ['validee', 'payee', 'impayee'])
            ->where('vente.id_admin', $user->id_admin)
            ->when(! $user instanceof \App\Models\Admin, fn ($query) => $query
                ->where('vente.id_commercial', $user->id_commercial))
            ->whereColumn('vente.id_client', 'client.id_client');

        $query = Client::query()
            ->select([
                'client.id_client',
                'client.matricule',
                'client.type',
                'client.nom',
                'client.prenom',
                'client.telephone',
                'client.email',
                'client.entreprise',
            ])
            ->selectSub($purchaseQuery()->selectRaw('COUNT(*)'), 'nombre_achats')
            ->selectSub($purchaseQuery()->selectRaw('SUM(COALESCE(vente.montant_ttc, vente.montant_total))'), 'total_achete')
            ->selectSub($purchaseQuery()->selectRaw('MAX(COALESCE(vente.date_vente, vente.created_at))'), 'dernier_achat');

        if ($user instanceof \App\Models\Admin) {
            $query->where('client.id_admin', $user->id_admin);
        } else {
            $query->where('client.id_commercial', $user->id_commercial);
        }

        $query->whereExists($purchaseQuery()->selectRaw('1'));

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where(function (Builder $builder) use ($search) {
                $builder->where('client.matricule', 'like', "%{$search}%")
                    ->orWhere('client.nom', 'like', "%{$search}%")
                    ->orWhere('client.prenom', 'like', "%{$search}%")
                    ->orWhere('client.telephone', 'like', "%{$search}%")
                    ->orWhere('client.email', 'like', "%{$search}%")
                    ->orWhere('client.entreprise', 'like', "%{$search}%");
            });
        }

        $perPage = min(max($request->integer('per_page', 10), 1), 100);
        return response()->json($query
            ->orderByDesc('dernier_achat')
            ->orderByDesc('client.id_client')
            ->paginate($perPage));
    }

    /**
     * Liste des clients
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Client::with(['commercial:id_commercial,nom,prenom']);

        // Filtrage selon le type d'utilisateur
        if ($user instanceof \App\Models\Admin) {
            $query->where('id_admin', $user->id_admin);
        } else {
            // Commercial → seulement ses clients
            $query->where('id_commercial', $user->id_commercial);
        }

        // Recherche
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('telephone', 'like', "%{$search}%")
                  ->orWhere('entreprise', 'like', "%{$search}%")
                  ->orWhere('matricule', 'like', "%{$search}%");
            });
        }

        // Filtre par type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $clients = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json($clients);
    }

    /**
     * Créer un client
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'matricule'       => 'required|string|max:100',
            'type'           => 'required|in:particulier,entreprise,autre',
            'nom'            => 'required|string|max:100',
            'prenom'         => 'nullable|string|max:100',
            'email'          => 'nullable|email|max:180',
            'telephone'      => 'nullable|string|max:30',
            'facebook'       => 'nullable|string|max:255',
            'linkedin'       => 'nullable|string|max:255',
            'entreprise'     => 'nullable|string|max:150',
            'poste'          => 'nullable|string|max:100',
            'classification' => 'nullable|string|max:100',
            'profession'     => 'nullable|string|max:100',
            'site_web'       => 'nullable|string|max:255',
            'pays'           => 'nullable|string|max:100',
            'domaine'        => 'nullable|string|max:100',
            'id_commercial'  => 'nullable|exists:commercial,id_commercial',
        ]);

        // Attribution automatique
        if ($user instanceof \App\Models\Admin) {
            $validated['id_admin'] = $user->id_admin;
        } else {
            $validated['id_admin'] = $user->id_admin;
            $validated['id_commercial'] = $user->id_commercial;
        }

        $client = Client::create($validated);

        return response()->json([
            'message' => 'Client créé avec succès',
            'client'  => $client->load('commercial:id_commercial,nom,prenom')
        ], 201);
    }

    /**
     * Afficher un client
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();

        $client = Client::with([
            'commercial:id_commercial,nom,prenom',
            'prospections',
            'rendezVous',
            'interets'
        ])->findOrFail($id);

        // Sécurité : vérifier que l'utilisateur a le droit de voir ce client
        if ($user instanceof \App\Models\Admin) {
            if ($client->id_admin !== $user->id_admin) {
                return response()->json(['message' => 'Non autorisé'], 403);
            }
        } else {
            if ($client->id_commercial !== $user->id_commercial) {
                return response()->json(['message' => 'Non autorisé'], 403);
            }
        }

        return response()->json($client);
    }

    /**
     * Mettre à jour un client
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $client = Client::findOrFail($id);

        // Sécurité
        if ($user instanceof \App\Models\Admin) {
            if ($client->id_admin !== $user->id_admin) {
                return response()->json(['message' => 'Non autorisé'], 403);
            }
        } else {
            if ($client->id_commercial !== $user->id_commercial) {
                return response()->json(['message' => 'Non autorisé'], 403);
            }
        }

        $validated = $request->validate([
            'matricule'       => 'sometimes|string|max:100',
            'type'           => 'sometimes|in:particulier,entreprise,autre',
            'nom'            => 'sometimes|string|max:100',
            'prenom'         => 'nullable|string|max:100',
            'email'          => 'nullable|email|max:180',
            'telephone'      => 'nullable|string|max:30',
            'facebook'       => 'nullable|string|max:255',
            'linkedin'       => 'nullable|string|max:255',
            'entreprise'     => 'nullable|string|max:150',
            'poste'          => 'nullable|string|max:100',
            'classification' => 'nullable|string|max:100',
            'profession'     => 'nullable|string|max:100',
            'site_web'       => 'nullable|string|max:255',
            'pays'           => 'nullable|string|max:100',
            'domaine'        => 'nullable|string|max:100',
            'id_commercial'  => 'nullable|exists:commercial,id_commercial',
        ]);

        $client->update($validated);

        return response()->json([
            'message' => 'Client mis à jour avec succès',
            'client'  => $client->fresh()->load('commercial:id_commercial,nom,prenom')
        ]);
    }

    /**
     * Supprimer un client
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $client = Client::findOrFail($id);

        // Sécurité
        if ($user instanceof \App\Models\Admin) {
            if ($client->id_admin !== $user->id_admin) {
                return response()->json(['message' => 'Non autorisé'], 403);
            }
        } else {
            if ($client->id_commercial !== $user->id_commercial) {
                return response()->json(['message' => 'Non autorisé'], 403);
            }
        }

        $client->delete();

        return response()->json([
            'message' => 'Client supprimé avec succès'
        ]);
    }
}
