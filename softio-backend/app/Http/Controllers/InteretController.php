<?php

namespace App\Http\Controllers;

use App\Models\Interet;
use Illuminate\Http\Request;

class InteretController extends Controller
{
    public function index(Request $request)
    {
        $query = Interet::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('prospect', 'like', "%{$search}%")
                  ->orWhere('produit', 'like', "%{$search}%")
                  ->orWhere('commentaire', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('id', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'prospect' => 'required|string|max:150',
            'type' => 'required|in:particulier,entreprise',
            'produit' => 'required|string|max:191',
            'typeOffre' => 'required|string|max:50',
            'date' => 'required|string',
            'niveau' => 'required|in:Élevé,Moyen,Faible',
            'commentaire' => 'nullable|string',
        ]);

        $interet = Interet::create($validated);

        return response()->json($interet, 201);
    }

    public function update(Request $request, Interet $interet)
    {
        $validated = $request->validate([
            'prospect' => 'sometimes|string|max:150',
            'type' => 'sometimes|in:particulier,entreprise',
            'produit' => 'sometimes|string|max:191',
            'typeOffre' => 'sometimes|string|max:50',
            'date' => 'sometimes|string',
            'niveau' => 'sometimes|in:Élevé,Moyen,Faible',
            'commentaire' => 'nullable|string',
        ]);

        $interet->update($validated);

        return response()->json($interet);
    }

    public function destroy(Interet $interet)
    {
        $interet->delete();

        return response()->json(['message' => 'Intérêt supprimé']);
    }
}
