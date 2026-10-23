<?php

namespace App\Http\Controllers;

use App\Models\Vente;
use Illuminate\Http\Request;

class VenteController extends Controller
{
    public function index(Request $request)
    {
        $query = Vente::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('num', 'like', "%{$search}%");
        }

        if ($request->filled('type') && $request->input('type') !== 'Tous') {
            $query->where('type', $request->input('type'));
        }

        return response()->json($query->orderBy('id', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'num' => 'nullable|string|max:50|unique:ventes',
            'type' => 'required|string|max:50',
            'montant' => 'required|string',
            'date' => 'required|string',
            'totalHT' => 'required|string',
            'tva' => 'nullable|string',
            'statut' => 'required|string|max:50',
        ]);

        if (empty($validated['num'])) {
            $count = Vente::count() + 1;
            $validated['num'] = 'VTE-2026-' . str_pad($count, 4, '0', STR_PAD_LEFT);
        }

        $vente = Vente::create($validated);

        return response()->json($vente, 201);
    }

    public function update(Request $request, Vente $vente)
    {
        $validated = $request->validate([
            'num' => 'sometimes|string|max:50|unique:ventes,num,' . $vente->id,
            'type' => 'sometimes|string|max:50',
            'montant' => 'sometimes|string',
            'date' => 'sometimes|string',
            'totalHT' => 'sometimes|string',
            'tva' => 'nullable|string',
            'statut' => 'sometimes|string|max:50',
        ]);

        $vente->update($validated);

        return response()->json($vente);
    }

    public function destroy(Vente $vente)
    {
        $vente->delete();

        return response()->json(['message' => 'Vente supprimée']);
    }
}
