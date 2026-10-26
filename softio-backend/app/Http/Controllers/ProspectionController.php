<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Client;
use App\Models\Prospection;
use App\Traits\ScopesToOwner;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProspectionController extends Controller
{
    use ScopesToOwner;

    public function index(Request $request): JsonResponse
    {
        $query = Prospection::with(['client:id_client,nom,prenom,entreprise', 'commercial:id_commercial,nom,prenom']);
        
        $this->scopeToOwner($query, $request->user());

        // Filtrer par état (ex: 'en_cours', 'gagne', 'perdu')
        if ($request->filled('etat')) {
            $query->where('etat', $request->etat);
        }

        // Filtrer les perdus ou actifs
        if ($request->has('est_perdu')) {
            $query->where('est_perdu', $request->boolean('est_perdu'));
        }

        $prospections = $query->orderByDesc('created_at')->paginate(15);
        return response()->json($prospections);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_client'         => 'required|exists:client,id_client',
            'id_offre'          => 'nullable|exists:offre,id_offre', // Si tu as une table offre
            'produit_prospecte' => 'nullable|string|max:255',
            'etat'              => 'required|string|max:50',
            'note_actuelle'     => 'nullable|integer',
            'est_perdu'         => 'boolean',
        ]);

        $user = $request->user();
        $validated['id_admin'] = $user->id_admin;
        
        if (! $user instanceof Admin) {
            $validated['id_commercial'] = $user->id_commercial;
        }

        $prospection = Prospection::create($validated);

        return response()->json([
            'message' => 'Prospection créée avec succès',
            'prospection' => $prospection->load('client')
        ], 201);
    }

    public function show(Request $request, $id): JsonResponse
    {
        $prospection = Prospection::with(['client', 'commercial', 'propositions', 'closing'])->findOrFail($id);
        
        $this->authorizeOwnership($prospection, $request->user());

        return response()->json($prospection);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $prospection = Prospection::findOrFail($id);
        $this->authorizeOwnership($prospection, $request->user());

        $validated = $request->validate([
            'id_client'         => 'sometimes|exists:client,id_client',
            'id_offre'          => 'nullable|exists:offre,id_offre',
            'produit_prospecte' => 'nullable|string|max:255',
            'etat'              => 'sometimes|string|max:50',
            'note_actuelle'     => 'nullable|integer',
            'est_perdu'         => 'boolean',
        ]);

        $prospection->update($validated);

        return response()->json([
            'message' => 'Prospection mise à jour avec succès',
            'prospection' => $prospection->fresh()->load('client')
        ]);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $prospection = Prospection::findOrFail($id);
        $this->authorizeOwnership($prospection, $request->user());

        $prospection->delete();
        return response()->json(['message' => 'Prospection supprimée']);
    }
}