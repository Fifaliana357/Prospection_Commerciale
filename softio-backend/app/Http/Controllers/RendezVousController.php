<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\RendezVous;
use App\Traits\ScopesToOwner;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RendezVousController extends Controller
{
    use ScopesToOwner;

    public function index(Request $request): JsonResponse
    {
        $query = RendezVous::with(['client:id_client,nom,prenom,entreprise', 'commercial:id_commercial,nom,prenom']);
        $this->scopeToOwner($query, $request->user());

        if ($request->filled('date_debut') && $request->filled('date_fin')) {
            $query->whereBetween('date_heure', [$request->date_debut, $request->date_fin]);
        }

        $rendezVous = $query->orderBy('date_heure', 'asc')->paginate(15);
        return response()->json($rendezVous);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_client'   => 'required|exists:client,id_client',
            'date_rdv'    => 'required|date',
            'type_rdv'    => 'required|string|max:150',
            'commentaire' => 'nullable|string',
            'lieu'        => 'nullable|string|max:150',
        ]);

        $user = $request->user();
        $validated['id_admin'] = $user->id_admin;

        if (! $user instanceof Admin) {
            $validated['id_commercial'] = $user->id_commercial;
        }

        // Petit bonus : générer un numéro automatique
        $validated['numero_rdv'] = 'RDV-' . time();

        $rdv = RendezVous::create($validated);

        return response()->json([
            'message' => 'Rendez-vous planifié avec succès',
            'rendez_vous' => $rdv->load('client')
        ], 201);
    }

    public function show(Request $request, $id): JsonResponse
    {
        $rdv = RendezVous::with('client')->findOrFail($id);
        $this->authorizeOwnership($rdv, $request->user());
        return response()->json($rdv);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $rdv = RendezVous::findOrFail($id);
        $this->authorizeOwnership($rdv, $request->user());

        $validated = $request->validate([
            'date_heure'  => 'sometimes|date',
            'titre'       => 'sometimes|string|max:150',
            'description' => 'nullable|string',
            'lieu'        => 'nullable|string|max:150',
            'statut'      => 'sometimes|string',
        ]);

        $rdv->update($validated);

        return response()->json([
            'message' => 'Rendez-vous mis à jour',
            'rendez_vous' => $rdv->fresh()
        ]);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $rdv = RendezVous::findOrFail($id);
        $this->authorizeOwnership($rdv, $request->user());
        $rdv->delete();
        return response()->json(['message' => 'Rendez-vous supprimé']);
    }
}
