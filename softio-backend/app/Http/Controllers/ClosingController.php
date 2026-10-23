<?php

namespace App\Http\Controllers;

use App\Models\Closing;
use Illuminate\Http\Request;

class ClosingController extends Controller
{
    public function index(Request $request)
    {
        $query = Closing::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('offre', 'like', "%{$search}%")
                  ->orWhere('client', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('id', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'offre' => 'required|string|max:191',
            'description' => 'nullable|string',
            'montant' => 'required|string',
            'client' => 'required|string|max:150',
            'email' => 'nullable|string|max:150',
            'editeur' => 'nullable|string|max:100',
        ]);

        $closing = Closing::create($validated);

        return response()->json($closing, 201);
    }

    public function update(Request $request, Closing $closing)
    {
        $validated = $request->validate([
            'offre' => 'sometimes|string|max:191',
            'description' => 'nullable|string',
            'montant' => 'sometimes|string',
            'client' => 'sometimes|string|max:150',
            'email' => 'nullable|string|max:150',
            'editeur' => 'nullable|string|max:100',
        ]);

        $closing->update($validated);

        return response()->json($closing);
    }

    public function destroy(Closing $closing)
    {
        $closing->delete();

        return response()->json(['message' => 'Closing supprimé']);
    }
}
