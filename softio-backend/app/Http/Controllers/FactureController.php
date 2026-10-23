<?php

namespace App\Http\Controllers;

use App\Models\Facture;
use Illuminate\Http\Request;

class FactureController extends Controller
{
    public function index(Request $request)
    {
        $query = Facture::query();

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
            'num' => 'nullable|string|max:50|unique:factures',
            'type' => 'required|string|max:50',
            'montant' => 'required|string',
            'date' => 'required|string',
            'totalHT' => 'nullable|string',
            'tva' => 'nullable|string',
            'statut' => 'required|string|max:50',
        ]);

        if (empty($validated['num'])) {
            $count = Facture::count() + 1;
            $validated['num'] = '2026-' . str_pad($count, 4, '0', STR_PAD_LEFT);
        }

        if (empty($validated['totalHT'])) {
            $validated['totalHT'] = $validated['montant'];
        }

        $facture = Facture::create($validated);

        return response()->json($facture, 201);
    }

    public function update(Request $request, Facture $facture)
    {
        $validated = $request->validate([
            'num' => 'sometimes|string|max:50|unique:factures,num,' . $facture->id,
            'type' => 'sometimes|string|max:50',
            'montant' => 'sometimes|string',
            'date' => 'sometimes|string',
            'totalHT' => 'nullable|string',
            'tva' => 'nullable|string',
            'statut' => 'sometimes|string|max:50',
        ]);

        $facture->update($validated);

        return response()->json($facture);
    }

    public function destroy(Facture $facture)
    {
        $facture->delete();

        return response()->json(['message' => 'Facture supprimée']);
    }
}
