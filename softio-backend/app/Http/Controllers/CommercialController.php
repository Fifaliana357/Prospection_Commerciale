<?php

namespace App\Http\Controllers;

use App\Models\Commercial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class CommercialController extends Controller
{
    public function index(Request $request)
    {
        $query = Commercial::query();

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('nom', 'like', "%{$s}%")
                  ->orWhere('prenom', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('telephone', 'like', "%{$s}%");
            });
        }

        if ($request->filled('actif')) {
            $query->where('actif', $request->actif === '1' || $request->actif === 'true');
        }

        return response()->json(
            $query->with('admin:id_admin,nom,prenom')->orderBy('nom')->paginate(10)
        );
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'nom'       => 'required|string|max:191',
            'prenom'    => 'nullable|string|max:191',
            'email'     => 'required|email|unique:commercial,email',
            'telephone' => 'nullable|string|max:191',
            'actif'     => 'sometimes|boolean',
        ]);

        $plainPassword = \Illuminate\Support\Str::random(8);

        $commercial = \App\Models\Commercial::create([
            'id_admin'       => $user->id_admin ?? 1,
            'nom'            => $validated['nom'],
            'prenom'         => $validated['prenom'] ?? null,
            'email'          => $validated['email'],
            'telephone'      => $validated['telephone'] ?? null,
            'password'       => \Illuminate\Support\Facades\Hash::make($plainPassword),
            'is_first_login' => true,
            'actif'          => $validated['actif'] ?? true,
        ]);

        return response()->json([
            'message' => 'Commercial créé',
            'commercial' => $commercial,
            'password_temporaire' => $plainPassword,
        ], 201);
    }

    public function update(Request $request, int $id)
    {
        $commercial = Commercial::findOrFail($id);

        $validated = $request->validate([
            'nom'       => 'sometimes|string|max:191',
            'prenom'    => 'nullable|string|max:191',
            'email'     => 'sometimes|email|unique:commercial,email,' . $id . ',id_commercial',
            'telephone' => 'nullable|string|max:191',
            'password'  => 'nullable|string|min:6',
            'actif'     => 'sometimes|boolean',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $commercial->update($validated);

        return response()->json(['message' => 'Commercial modifié', 'commercial' => $commercial]);
    }

    public function destroy(int $id)
    {
        Commercial::findOrFail($id)->delete();
        return response()->json(['message' => 'Commercial supprimé']);
    }
}
