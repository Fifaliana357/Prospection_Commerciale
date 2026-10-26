<?php

namespace App\Http\Controllers;

use App\Models\Produit;
use App\Models\StockMouvement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StockController extends Controller
{
    /**
     * Enregistrer un mouvement de stock
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_produit'     => 'required|exists:produit,id_produit',
            'type_mouvement' => 'required|in:entree,sortie',
            'quantite'       => 'required|integer|min:1',
            'reference'      => 'nullable|string|max:100',
            'commentaire'    => 'nullable|string',
            'date_mouvement' => 'required|date',
        ]);

        // Vérifier que le produit appartient bien à l'admin
        $produit = Produit::where('id_admin', $request->user()->id_admin)
            ->findOrFail($validated['id_produit']);

        $validated['id_admin'] = $request->user()->id_admin;
        $validated['id_commercial'] = $request->user()->id_commercial ?? null;

        // (Optionnel) Vérifier qu'il y a assez de stock pour une sortie
        if ($validated['type_mouvement'] === 'sortie') {
            $stockActuel = $produit->mouvementsStock()
                ->where('type_mouvement', 'entree')->sum('quantite') 
                - $produit->mouvementsStock()
                ->where('type_mouvement', 'sortie')->sum('quantite');
                
            if ($stockActuel < $validated['quantite']) {
                return response()->json([
                    'message' => 'Stock insuffisant pour ce produit.',
                    'stock_actuel' => $stockActuel
                ], 400);
            }
        }

        $mouvement = StockMouvement::create($validated);

        return response()->json([
            'message' => 'Mouvement de stock enregistré avec succès',
            'mouvement' => $mouvement
        ], 201);
    }

    /**
     * Historique des mouvements pour un produit ou global
     */
    public function index(Request $request): JsonResponse
    {
        $query = StockMouvement::with('produit')
            ->where('id_admin', $request->user()->id_admin);

        if ($request->filled('id_produit')) {
            $query->where('id_produit', $request->id_produit);
        }

        $mouvements = $query->orderByDesc('date_mouvement')->paginate(20);
        
        return response()->json($mouvements);
    }
}