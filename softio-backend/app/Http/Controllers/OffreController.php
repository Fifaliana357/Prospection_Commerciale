<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Offre;
use Illuminate\Http\Request;

class OffreController extends Controller
{
    public function index(Request $request)
    {
        $query = Offre::query()->where('id_admin', $request->user()->id_admin);

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('denomination', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%");
            });
        }

        return response()->json(
            $query->orderBy('denomination')->paginate(10)
        );
    }

    public function store(Request $request)
    {
        $user = $request->user();
        abort_unless($user instanceof Admin, 403, 'Le catalogue est en lecture seule pour les commerciaux.');

        $validated = $request->validate([
            'denomination' => 'required|string|max:191',
            'description'  => 'nullable|string',
            'tarif'        => 'required|numeric|min:0',
        ]);

        $offre = Offre::create([
            ...$validated,
            'id_admin' => $user->id_admin ?? null,
            'actif'    => true,
        ]);

        return response()->json(['message' => 'Service créé', 'offre' => $offre], 201);
    }

    public function update(Request $request, int $id)
    {
        abort_unless($request->user() instanceof Admin, 403, 'Le catalogue est en lecture seule pour les commerciaux.');
        $offre = Offre::query()->where('id_admin', $request->user()->id_admin)->findOrFail($id);

        $validated = $request->validate([
            'denomination' => 'sometimes|string|max:191',
            'description'  => 'nullable|string',
            'tarif'        => 'sometimes|numeric|min:0',
            'actif'        => 'sometimes|boolean',
        ]);

        $offre->update($validated);

        return response()->json(['message' => 'Service modifié', 'offre' => $offre]);
    }

    public function destroy(Request $request, int $id)
    {
        abort_unless($request->user() instanceof Admin, 403, 'Le catalogue est en lecture seule pour les commerciaux.');
        Offre::query()->where('id_admin', $request->user()->id_admin)->findOrFail($id)->delete();
        return response()->json(['message' => 'Service supprimé']);
    }
}
