<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Commercial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AccountController extends Controller
{
    public function show(Request $request)
    {
        return response()->json(['user' => $this->profileData($request->user())]);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'nom' => 'required|string|max:191',
            'prenom' => 'required|string|max:191',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profil mis à jour.',
            'user' => $this->profileData($user->fresh()),
        ]);
    }

    public function updateEmail(Request $request)
    {
        $user = $request->user();
        $table = $user instanceof Admin ? 'admin' : 'commercial';
        $key = $user instanceof Admin ? 'id_admin' : 'id_commercial';
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:191', Rule::unique($table, 'email')->ignore($user->{$key}, $key)],
            'current_password' => 'required|string',
        ]);

        $this->verifyCurrentPassword($user, $validated['current_password']);
        $user->update(['email' => $validated['email']]);

        return response()->json([
            'message' => 'Adresse e-mail mise à jour.',
            'user' => $this->profileData($user->fresh()),
        ]);
    }

    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();
        $this->verifyCurrentPassword($user, $validated['current_password']);
        $user->update(['password' => Hash::make($validated['password'])]);

        return response()->json(['message' => 'Mot de passe mis à jour.']);
    }

    private function verifyCurrentPassword(Admin|Commercial $user, string $password): void
    {
        if (! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Le mot de passe actuel est incorrect.'],
            ]);
        }
    }

    private function profileData(Admin|Commercial $user): array
    {
        return [
            'nom' => $user->nom,
            'prenom' => $user->prenom,
            'email' => $user->email,
            'role' => $user instanceof Admin ? 'admin' : 'commercial',
        ];
    }
}
