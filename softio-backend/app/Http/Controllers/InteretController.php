<?php

namespace App\Http\Controllers;

use App\Models\Interet;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InteretController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Récupérer les clients qui ont au moins un intérêt
        $query = Client::with(['interets'])
            ->whereHas('interets');

        // Filtre par produit
        if ($request->filled('produit')) {
            $query->whereHas('interets', function ($q) use ($request) {
                $q->where('produit_concerne', 'like', '%' . $request->produit . '%');
            });
        }

        // Recherche
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('telephone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Sécurité simple (admin voit tout pour l’instant)
        $clients = $query->orderBy('nom')->paginate(20);

        // Liste des produits distincts pour les filtres
        $produits = Interet::select('produit_concerne')
            ->whereNotNull('produit_concerne')
            ->where('produit_concerne', '!=', '')
            ->distinct()
            ->orderBy('produit_concerne')
            ->pluck('produit_concerne');

        return response()->json([
            'clients' => $clients,
            'produits' => $produits,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_client' => 'required|exists:client,id_client',
            'produit_concerne' => 'required|string|max:191',
            'niveau' => 'nullable|integer|min:0|max:5',
        ]);

        $interet = Interet::create([
            'id_client' => $validated['id_client'],
            'produit_concerne' => $validated['produit_concerne'],
            'niveau' => $validated['niveau'] ?? 0,
        ]);

        return response()->json([
            'message' => 'Intérêt ajouté',
            'interet' => $interet
        ], 201);
    }

    public function destroy($id)
    {
        $interet = Interet::findOrFail($id);
        $interet->delete();

        return response()->json(['message' => 'Intérêt supprimé']);
    }
}
