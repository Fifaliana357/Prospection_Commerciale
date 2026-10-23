<?php

namespace App\Http\Controllers;

use App\Models\Commercial;
use Illuminate\Http\Request;

class CommercialController extends Controller
{
    public function index(Request $request)
    {
        $query = Commercial::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('contact', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('id', 'asc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:commerciaux',
            'contact' => 'nullable|string|max:50',
            'prospects' => 'nullable|integer',
            'ventes' => 'nullable|integer',
        ]);

        $commercial = Commercial::create($validated);

        return response()->json($commercial, 201);
    }

    public function update(Request $request, Commercial $commercial)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|string|max:100',
            'prenom' => 'sometimes|string|max:100',
            'email' => 'sometimes|email|max:150|unique:commerciaux,email,' . $commercial->id,
            'contact' => 'nullable|string|max:50',
            'prospects' => 'nullable|integer',
            'ventes' => 'nullable|integer',
        ]);

        $commercial->update($validated);

        return response()->json($commercial);
    }

    public function destroy(Commercial $commercial)
    {
        $commercial->delete();

        return response()->json(['message' => 'Commercial supprimé']);
    }
}
