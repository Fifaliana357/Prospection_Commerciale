<?php

namespace App\Http\Controllers;

use App\Models\Tutoriel;
use Illuminate\Http\Request;

class TutorielController extends Controller
{
    public function index(Request $request)
    {
        $query = Tutoriel::query()->where('id_admin', $request->user()->id_admin);

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where('titre', 'like', "%{$s}%");
        }

        return response()->json(
            $query->orderByDesc('created_at')->paginate(10)
        );
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'titre' => 'required|string|max:191',
            'lien'  => 'required|url|max:500',
        ]);

        $tutoriel = Tutoriel::create([
            ...$validated,
            'id_admin' => $user->id_admin,
        ]);

        return response()->json(['message' => 'Tutoriel créé', 'tutoriel' => $tutoriel], 201);
    }

    public function update(Request $request, int $id)
    {
        $tutoriel = Tutoriel::query()->where('id_admin', $request->user()->id_admin)->findOrFail($id);

        $validated = $request->validate([
            'titre' => 'sometimes|string|max:191',
            'lien'  => 'sometimes|url|max:500',
        ]);

        $tutoriel->update($validated);

        return response()->json(['message' => 'Tutoriel modifié', 'tutoriel' => $tutoriel]);
    }

    public function destroy(Request $request, int $id)
    {
        Tutoriel::query()->where('id_admin', $request->user()->id_admin)->findOrFail($id)->delete();
        return response()->json(['message' => 'Tutoriel supprimé']);
    }
}
