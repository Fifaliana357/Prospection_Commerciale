<?php

namespace App\Http\Controllers;

use App\Models\RendezVous;
use Illuminate\Http\Request;

class RendezVousController extends Controller
{
    public function index(Request $request)
    {
        $query = RendezVous::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('prospect', 'like', "%{$search}%")
                  ->orWhere('contact', 'like', "%{$search}%")
                  ->orWhere('commentaire', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('id', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|string',
            'heure' => 'required|string',
            'prospect' => 'required|string|max:150',
            'contact' => 'nullable|string|max:50',
            'mode' => 'required|string|max:50',
            'lieu' => 'nullable|string|max:191',
            'commentaire' => 'nullable|string',
            'statut' => 'required|string|max:50',
        ]);

        $rdv = RendezVous::create($validated);

        return response()->json($rdv, 201);
    }

    public function update(Request $request, RendezVous $rendezVous)
    {
        $validated = $request->validate([
            'date' => 'sometimes|string',
            'heure' => 'sometimes|string',
            'prospect' => 'sometimes|string|max:150',
            'contact' => 'nullable|string|max:50',
            'mode' => 'sometimes|string|max:50',
            'lieu' => 'nullable|string|max:191',
            'commentaire' => 'nullable|string',
            'statut' => 'sometimes|string|max:50',
        ]);

        $rendezVous->update($validated);

        return response()->json($rendezVous);
    }

    public function destroy(RendezVous $rendezVous)
    {
        $rendezVous->delete();

        return response()->json(['message' => 'Rendez-vous supprimé']);
    }
}
