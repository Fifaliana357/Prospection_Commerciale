<?php

namespace App\Http\Controllers;

use App\Models\Produit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProduitController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Produit::where('id_admin', $request->user()->id_admin);

        if ($request->filled('search')) {
            $s = $request->string('search');
            $query->where(function ($q) use ($s) {
                $q->where('designation', 'like', "%{$s}%")
                  ->orWhere('reference', 'like', "%{$s}%")
                  ->orWhere('mots_cles', 'like', "%{$s}%");
            });
        }

        $produits = $query->orderByDesc('created_at')->paginate(15);
        
        // On pourrait ajouter une logique pour calculer le stock actuel ici
        return response()->json($produits);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'designation'   => 'required|string|max:150',
            'reference'     => 'nullable|string|max:100',
            'description'   => 'nullable|string',
            'prix_unitaire' => 'required|integer|min:0',
            'mots_cles'     => 'nullable|string|max:255',
            'actif'         => 'boolean',
        ]);

        $validated['id_admin'] = $request->user()->id_admin;
        $produit = Produit::create($validated);

        return response()->json([
            'message' => 'Produit créé avec succès',
            'produit' => $produit
        ], 201);
    }

    public function show(Request $request, $id): JsonResponse
    {
        $produit = Produit::with('mouvementsStock')
            ->where('id_admin', $request->user()->id_admin)
            ->findOrFail($id);
            
        return response()->json($produit);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $produit = Produit::where('id_admin', $request->user()->id_admin)->findOrFail($id);

        $validated = $request->validate([
            'designation'   => 'sometimes|string|max:150',
            'reference'     => 'nullable|string|max:100',
            'description'   => 'nullable|string',
            'prix_unitaire' => 'sometimes|integer|min:0',
            'mots_cles'     => 'nullable|string|max:255',
            'actif'         => 'boolean',
        ]);

        $produit->update($validated);

        return response()->json([
            'message' => 'Produit mis à jour avec succès',
            'produit' => $produit->fresh()
        ]);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $produit = Produit::where('id_admin', $request->user()->id_admin)->findOrFail($id);
        $produit->delete();

        return response()->json(['message' => 'Produit supprimé avec succès']);
    }
}