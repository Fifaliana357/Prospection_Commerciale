<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Produit;
use Illuminate\Http\Request;

class ProduitController extends Controller
{
    public function index(Request $request)
    {
        $query = Produit::query()->where('id_admin', $request->user()->id_admin);

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('reference', 'like', "%{$s}%")
                  ->orWhere('designation', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%");
            });
        }

        return response()->json(
            $query->orderBy('designation')->paginate(10)
        );
    }

public function store(Request $request)
{
    $user = $request->user();
    abort_unless($user instanceof Admin, 403, 'Le catalogue est en lecture seule pour les commerciaux.');

    $validated = $request->validate([
        'reference'     => 'required|string|max:50',
        'designation'   => 'required|string|max:191',
        'description'   => 'nullable|string',
        'prix_unitaire' => 'required|numeric|min:0',
        'photo'         => 'nullable|image|max:2048',
    ]);

    $data = [
        'reference'     => $validated['reference'],
        'designation'   => $validated['designation'],
        'description'   => $validated['description'] ?? null,
        'prix_unitaire' => $validated['prix_unitaire'],
        'id_admin'      => $user->id_admin ?? null,
        'actif'         => true,
    ];

    if ($request->hasFile('photo')) {
        $data['photo'] = $request->file('photo')->store('produits', 'public');
    }

    $produit = Produit::create($data);

    return response()->json(['message' => 'Produit créé', 'produit' => $produit], 201);
}

public function update(Request $request, int $id)
{
    abort_unless($request->user() instanceof Admin, 403, 'Le catalogue est en lecture seule pour les commerciaux.');
    $produit = Produit::query()->where('id_admin', $request->user()->id_admin)->findOrFail($id);

    $validated = $request->validate([
        'reference'     => 'sometimes|string|max:50',
        'designation'   => 'sometimes|string|max:191',
        'description'   => 'nullable|string',
        'prix_unitaire' => 'sometimes|numeric|min:0',
        'photo'         => 'nullable|image|max:2048',
    ]);

    $data = [];
    if ($request->has('reference')) {
        $data['reference'] = $validated['reference'];
    }
    if ($request->has('designation')) {
        $data['designation'] = $validated['designation'];
    }
    if ($request->has('description')) {
        $data['description'] = $validated['description'] ?? null;
    }
    if ($request->has('prix_unitaire')) {
        $data['prix_unitaire'] = $validated['prix_unitaire'];
    }

    if ($request->hasFile('photo')) {
        $data['photo'] = $request->file('photo')->store('produits', 'public');
    }

    $produit->update($data);

    return response()->json(['message' => 'Produit modifié', 'produit' => $produit->fresh()]);
}

    public function destroy(Request $request, int $id)
    {
        abort_unless($request->user() instanceof Admin, 403, 'Le catalogue est en lecture seule pour les commerciaux.');
        Produit::query()->where('id_admin', $request->user()->id_admin)->findOrFail($id)->delete();
        return response()->json(['message' => 'Produit supprimé']);
    }


}
