<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Client;
use App\Models\Prospection;
use App\Models\Produit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $isAdmin = $user instanceof Admin;

        // Requêtes de base
        $clientQuery = $isAdmin ? Client::where('id_admin', $user->id_admin) : Client::where('id_commercial', $user->id_commercial);
        $prospectionQuery = $isAdmin ? Prospection::where('id_admin', $user->id_admin) : Prospection::where('id_commercial', $user->id_commercial);

        // Statistiques
        $totalClients = $clientQuery->count();
        $totalProspections = $prospectionQuery->count();
        
        // Prospections en cours (non perdues)
        $prospectionsActives = (clone $prospectionQuery)->where('est_perdu', false)->count();
        
        // Prospections gagnées (Exemple : etat = 'gagne' ou 'closing')
        $prospectionsGagnees = (clone $prospectionQuery)->where('etat', 'gagne')->count();

        // Produits
        $totalProduits = $isAdmin ? Produit::where('id_admin', $user->id_admin)->count() : 0;

        // Alertes de stock (uniquement pour l'admin)
        $alertesStock = [];
        if ($isAdmin) {
            $produits = Produit::where('id_admin', $user->id_admin)->get();
            foreach ($produits as $produit) {
                $entrees = $produit->mouvementsStock()->where('type_mouvement', 'entree')->sum('quantite');
                $sorties = $produit->mouvementsStock()->where('type_mouvement', 'sortie')->sum('quantite');
                $stockActuel = $entrees - $sorties;

                if ($stockActuel <= 5) {
                    $alertesStock[] = [
                        'id_produit' => $produit->id_produit,
                        'designation' => $produit->designation,
                        'stock_actuel' => $stockActuel
                    ];
                }
            }
        }

        return response()->json([
            'total_clients' => $totalClients,
            'total_prospections' => $totalProspections,
            'prospections_actives' => $prospectionsActives,
            'prospections_gagnees' => $prospectionsGagnees,
            'total_produits' => $totalProduits,
            'alertes_stock' => array_slice($alertesStock, 0, 5),
        ]);
    }
}