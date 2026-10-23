<?php

namespace App\Http\Controllers;

use App\Models\Produit;
use Illuminate\Http\Request;

class ProduitController extends Controller
{
    public function index(Request $request)
    {
        $query = Produit::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('designation', 'like', "%{$search}%")
                  ->orWhere('ref', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type') && $request->input('type') !== 'Tous') {
            $query->where('type', $request->input('type'));
        }

        return response()->json($query->orderBy('id', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'ref' => 'required|string|max:50|unique:produits',
            'designation' => 'required|string|max:191',
            'type' => 'required|string|max:50',
            'prix' => 'required|string',
            'stock' => 'nullable|integer',
        ]);

        if ($validated['type'] === 'Service') {
            $validated['stock'] = null;
        }

        $produit = Produit::create($validated);

        return response()->json($produit, 201);
    }

    public function update(Request $request, Produit $produit)
    {
        $validated = $request->validate([
            'ref' => 'sometimes|string|max:50|unique:produits,ref,' . $produit->id,
            'designation' => 'sometimes|string|max:191',
            'type' => 'sometimes|string|max:50',
            'prix' => 'sometimes|string',
            'stock' => 'nullable|integer',
        ]);

        if (isset($validated['type']) && $validated['type'] === 'Service') {
            $validated['stock'] = null;
        }

        $produit->update($validated);

        return response()->json($produit);
    }

    public function destroy(Produit $produit)
    {
        $produit->delete();

        return response()->json(['message' => 'Produit supprimé']);
    }
}
