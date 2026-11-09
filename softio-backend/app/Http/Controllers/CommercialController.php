<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Commercial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class CommercialController extends Controller
{
    public function index(Request $request)
    {
        $query = Commercial::query()->where('id_admin', $request->user()->id_admin);

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
        abort_unless($user instanceof Admin, 403, 'Accès réservé à l’administrateur.');

        $validated = $request->validate([
            'nom'       => 'required|string|max:191',
            'prenom'    => 'nullable|string|max:191',
            'email'     => [
                'required',
                'email',
                function (string $attribute, mixed $value, \Closure $fail) {
                    if (Admin::where('email', $value)->exists() || Commercial::where('email', $value)->exists()) {
                        $fail('Cette adresse e-mail est déjà utilisée.');
                    }
                },
            ],
            'telephone' => 'nullable|string|max:191',
            'actif'     => 'sometimes|boolean',
        ]);

        $plainPassword = \Illuminate\Support\Str::random(8);

        $commercial = \App\Models\Commercial::create([
            'id_admin'       => $user->id_admin,
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
        $admin = $this->admin($request);
        $commercial = Commercial::query()->where('id_admin', $admin->id_admin)->findOrFail($id);

        $validated = $request->validate([
            'nom'       => 'sometimes|string|max:191',
            'prenom'    => 'nullable|string|max:191',
            'email'     => [
                'sometimes',
                'email',
                function (string $attribute, mixed $value, \Closure $fail) use ($id) {
                    if (
                        Admin::where('email', $value)->exists()
                        || Commercial::where('email', $value)->where('id_commercial', '!=', $id)->exists()
                    ) {
                        $fail('Cette adresse e-mail est déjà utilisée.');
                    }
                },
            ],
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

    public function destroy(Request $request, int $id)
    {
        $admin = $this->admin($request);
        Commercial::query()->where('id_admin', $admin->id_admin)->findOrFail($id)->delete();
        return response()->json(['message' => 'Commercial supprimé']);
    }

    private function admin(Request $request): Admin
    {
        abort_unless($request->user() instanceof Admin, 403, 'Accès réservé à l’administrateur.');

        return $request->user();
    }
}
