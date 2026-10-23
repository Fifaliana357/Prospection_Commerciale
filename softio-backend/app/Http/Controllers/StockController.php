<?php

namespace App\Http\Controllers;

use App\Models\MouvementStock;
use App\Models\Produit;
use Illuminate\Http\Request;

class StockController extends Controller
{
    public function getMouvements()
    {
        return response()->json(MouvementStock::orderBy('id', 'desc')->get());
    }

    public function getInventaire()
    {
        $produits = Produit::where('type', 'Produit')->get();

        $inventaire = $produits->map(function ($p) {
            $stock = $p->stock ?? 0;
            return [
                'ref' => $p->ref,
                'designation' => $p->designation,
                'stock' => $stock,
                'statut' => $stock < 5 ? 'Stock faible' : 'En stock',
            ];
        });

        return response()->json($inventaire);
    }

    public function storeMouvement(Request $request)
    {
        $validated = $request->validate([
            'ref' => 'required|string|max:50',
            'designation' => 'required|string|max:191',
            'quantite' => 'required|integer|min:1',
            'date' => 'required|string',
            'type' => 'required|in:Entrée,Sortie',
        ]);

        $mouvement = MouvementStock::create($validated);

        // Mettre à jour le stock du produit si présent
        $produit = Produit::where('ref', $validated['ref'])->first();
        if ($produit && $produit->type === 'Produit') {
            $currentStock = $produit->stock ?? 0;
            if ($validated['type'] === 'Entrée') {
                $produit->stock = $currentStock + $validated['quantite'];
            } else {
                $produit->stock = max(0, $currentStock - $validated['quantite']);
            }
            $produit->save();
        }

        return response()->json($mouvement, 201);
    }
}
