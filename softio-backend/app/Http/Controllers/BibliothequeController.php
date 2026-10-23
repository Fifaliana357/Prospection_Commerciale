<?php

namespace App\Http\Controllers;

use App\Models\BibliothequeFichier;
use Illuminate\Http\Request;

class BibliothequeController extends Controller
{
    public function index(Request $request)
    {
        $query = BibliothequeFichier::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('nom', 'like', "%{$search}%");
        }

        return response()->json($query->orderBy('id', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:191',
            'type' => 'nullable|string|max:50',
            'taille' => 'nullable|string|max:50',
            'date' => 'nullable|string|max:50',
        ]);

        if (empty($validated['type'])) {
            $parts = explode('.', $validated['nom']);
            $validated['type'] = count($parts) > 1 ? end($parts) : 'file';
        }

        if (empty($validated['taille'])) {
            $validated['taille'] = '—';
        }

        if (empty($validated['date'])) {
            $validated['date'] = date('d/m/Y');
        }

        $fichier = BibliothequeFichier::create($validated);

        return response()->json($fichier, 201);
    }

    public function destroy(BibliothequeFichier $bibliotheque)
    {
        $bibliotheque->delete();

        return response()->json(['message' => 'Fichier supprimé']);
    }
}
