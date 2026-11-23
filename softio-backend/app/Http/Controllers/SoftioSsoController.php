<?php

namespace App\Http\Controllers;

use App\Services\Softio\SoftioSsoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SoftioSsoController extends Controller
{
    public function exchange(Request $request, SoftioSsoService $sso): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:255'],
        ]);

        $session = $sso->connecter($validated['code']);
        $token = $session['user']->createToken('softio')->plainTextToken;

        return response()->json([
            'message' => 'Connexion réussie',
            'user' => $session['user'],
            'type' => $session['type'],
            'token' => $token,
        ]);
    }
}
