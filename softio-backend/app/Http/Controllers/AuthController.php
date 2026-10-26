<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Commercial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Connexion Admin ou Commercial
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'type' => 'required|in:admin,commercial',
        ]);

        if ($request->type === 'admin') {
            $user = Admin::where('email', $request->email)->first();
        } else {
            $user = Commercial::where('email', $request->email)->first();
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email ou mot de passe incorrect.'],
            ]);
        }

        // Vérifier si le commercial est actif
        if ($request->type === 'commercial' && !$user->actif) {
            return response()->json([
                'message' => 'Votre compte est désactivé.'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Connexion réussie',
            'user' => $user,
            'type' => $request->type,
            'token' => $token,
        ]);
    }

    /**
     * Déconnexion
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie'
        ]);
    }

    /**
     * Récupérer l'utilisateur connecté
     */
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
            'type' => $request->user() instanceof Admin ? 'admin' : 'commercial',
        ]);
    }
}
