<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Vente;
use App\Models\StockMouvement;
use App\Traits\ScopesToOwner;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class VenteController extends Controller
{
    use ScopesToOwner;

    public function index(Request $request): JsonResponse
    {
        $query = Vente::with(['client:id_client,nom,prenom,entreprise', 'commercial:id_commercial,nom,prenom']);
        $this->scopeToOwner($query, $request->user());

        $ventes = $query->orderByDesc('created_at')->paginate(15);
        return response()->json($ventes);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_client'        => 'required|exists:client,id_client',
            'montant_total'    => 'required|numeric|min:0',
            'statut'           => 'nullable|string',
            'produits'         => 'required|array',
            'produits.*.id_produit' => 'required|exists:produit,id_produit',
            'produits.*.quantite'   => 'required|integer|min:1',
        ]);

        $user = $request->user();

        return DB::transaction(function () use ($validated, $user) {

            $vente = Vente::create([
                'id_admin'      => $user->id_admin,
                'id_commercial' => $user instanceof Admin ? null : $user->id_commercial,
                'id_client'     => $validated['id_client'],
                'montant_total' => $validated['montant_total'],
                'statut'        => $validated['statut'] ?? 'payee',
            ]);

            foreach ($validated['produits'] as $item) {
                StockMouvement::create([
                    'id_produit'     => $item['id_produit'],
                    'id_admin'       => $user->id_admin,
                    'id_commercial'  => $user instanceof Admin ? null : $user->id_commercial,
                    'type_mouvement' => 'sortie',
                    'quantite'       => $item['quantite'],
                    'reference'      => 'VENTE-' . $vente->id_vente,
                    'commentaire'    => 'Déduction automatique suite à une vente.',
                    'date_mouvement' => now(),
                ]);
            }

            return response()->json([
                'message' => 'Vente enregistrée avec succès et stock mis à jour.',
                'vente' => $vente->load('client')
            ], 201);
        });
    }

    public function show(Request $request, $id): JsonResponse
    {
        $vente = Vente::with(['client', 'commercial'])->findOrFail($id);
        $this->authorizeOwnership($vente, $request->user());
        return response()->json($vente);
    }
}
