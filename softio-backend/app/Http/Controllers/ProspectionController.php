<?php

namespace App\Http\Controllers;

use App\Models\Prospection;
use Illuminate\Http\Request;

class ProspectionController extends Controller
{
    public function index(Request $request)
    {
        $query = Prospection::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('objet', 'like', "%{$search}%")
                  ->orWhere('nom', 'like', "%{$search}%")
                  ->orWhere('matricule', 'like', "%{$search}%")
                  ->orWhere('produit', 'like', "%{$search}%")
                  ->orWhere('entreprise', 'like', "%{$search}%")
                  ->orWhere('contact', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('id', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'matricule' => 'nullable|string|max:50',
            'date' => 'required|string',
            'objet' => 'required|string|max:191',
            'contact' => 'nullable|string|max:50',
            'nom' => 'nullable|string|max:100',
            'entreprise' => 'nullable|string|max:150',
            'fonction' => 'nullable|string|max:100',
            'produit' => 'nullable|string|max:191',
            'type' => 'nullable|string|max:50',
            'message' => 'nullable|string',
            'etat' => 'nullable|string|max:50',
            'editeur' => 'nullable|string|max:100',
            'score' => 'nullable|integer',
        ]);

        if (empty($validated['etat'])) {
            $validated['etat'] = 'Non clôturé';
        }

        $prospection = Prospection::create($validated);

        return response()->json($prospection, 201);
    }

    public function update(Request $request, Prospection $prospection)
    {
        $validated = $request->validate([
            'matricule' => 'nullable|string|max:50',
            'date' => 'sometimes|string',
            'objet' => 'sometimes|string|max:191',
            'contact' => 'nullable|string|max:50',
            'nom' => 'nullable|string|max:100',
            'entreprise' => 'nullable|string|max:150',
            'fonction' => 'nullable|string|max:100',
            'produit' => 'nullable|string|max:191',
            'type' => 'nullable|string|max:50',
            'message' => 'nullable|string',
            'etat' => 'sometimes|string|max:50',
            'editeur' => 'nullable|string|max:100',
            'score' => 'nullable|integer',
        ]);

        $prospection->update($validated);

        return response()->json($prospection);
    }

    public function destroy(Prospection $prospection)
    {
        $prospection->delete();

        return response()->json(['message' => 'Prospection supprimée']);
    }
}
