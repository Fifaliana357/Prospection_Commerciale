<?php

namespace App\Http\Controllers;

use App\Models\Admin; 
use App\Http\Requests\Commercial\StoreCommercialRequest;
use App\Http\Requests\Commercial\UpdateCommercialRequest;
use App\Http\Resources\CommercialResource;
use App\Models\Commercial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class CommercialController extends Controller
{
    /**
     * Liste des commerciaux de l'admin connecté
     */
    public function index(Request $request): JsonResponse
    {
        // Un admin ne voit que ses propres commerciaux
        $query = Commercial::where('id_admin', $request->user()->id_admin);

        // Recherche
        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filtre par statut (actif / inactif)
        if ($request->has('actif')) {
            $query->where('actif', $request->boolean('actif'));
        }

        $commerciaux = $query->orderByDesc('created_at')->paginate(15);

        return response()->json([
            'data' => CommercialResource::collection($commerciaux->items()),
            'meta' => [
                'current_page' => $commerciaux->currentPage(),
                'last_page'    => $commerciaux->lastPage(),
                'per_page'     => $commerciaux->perPage(),
                'total'        => $commerciaux->total(),
            ],
        ]);
    }

    /**
     * Créer un commercial
     */
    public function store(StoreCommercialRequest $request): JsonResponse
    {
        $data = $request->validated();
        
        $data['id_admin'] = $request->user()->id_admin;
        $data['password'] = Hash::make($data['password']);
        $data['actif'] = $data['actif'] ?? true;

        $commercial = Commercial::create($data);

        return (new CommercialResource($commercial))
            ->additional(['message' => 'Commercial créé avec succès'])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Afficher un commercial
     */
    public function show(Request $request, $id): JsonResponse
    {
        // On s'assure que le commercial appartient bien à l'admin connecté
        $commercial = Commercial::where('id_admin', $request->user()->id_admin)->findOrFail($id);

        return (new CommercialResource($commercial))->response();
    }

    /**
     * Mettre à jour un commercial
     */
    public function update(UpdateCommercialRequest $request, $id): JsonResponse
    {
        $commercial = Commercial::where('id_admin', $request->user()->id_admin)->findOrFail($id);

        $data = $request->validated();

        // Si le mot de passe est modifié, on le hash
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $commercial->update($data);

        return (new CommercialResource($commercial->fresh()))
            ->additional(['message' => 'Commercial mis à jour avec succès'])
            ->response();
    }

    /**
     * Supprimer un commercial
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $commercial = Commercial::where('id_admin', $request->user()->id_admin)->findOrFail($id);

        // On empêche la suppression s'il a des clients liés (pour garder l'historique)
        if ($commercial->clients()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer ce commercial car il a des clients associés.'
            ], 409);
        }

        $commercial->delete();

        return response()->json(['message' => 'Commercial supprimé avec succès']);
    }
}