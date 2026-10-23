<?php

namespace App\Http\Controllers;

use App\Models\Closing;
use App\Models\Prospect;
use App\Models\Prospection;
use App\Models\RendezVous;
use App\Models\Vente;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats()
    {
        $prospectsCount = Prospect::count();
        $prospectionsCount = Prospection::count();
        $rdvDuJourCount = RendezVous::count();

        // Calcul du montant des ventes
        $ventes = Vente::all();
        $totalVentes = 0;
        foreach ($ventes as $v) {
            $cleaned = preg_replace('/[^\d]/', '', $v->montant);
            $totalVentes += (float)$cleaned;
        }

        $formattedVentes = $totalVentes > 1000000
            ? number_format($totalVentes / 1000000, 1) . 'M'
            : number_format($totalVentes, 0, ',', ' ');

        // Activités récentes
        $activities = [];

        $recentProspects = Prospect::latest()->take(2)->get();
        foreach ($recentProspects as $p) {
            $name = trim(($p->prenom ?? '') . ' ' . ($p->nom ?? '')) ?: ($p->entreprise ?? 'Prospect');
            $activities[] = [
                'name' => $name,
                'action' => 'Nouveau prospect ajouté',
                'time' => $p->created_at ? $p->created_at->diffForHumans() : 'Récemment',
                'type' => 'prospect',
            ];
        }

        $recentClosings = Closing::latest()->take(2)->get();
        foreach ($recentClosings as $c) {
            $activities[] = [
                'name' => $c->client,
                'action' => 'Prospection clôturée (' . $c->offre . ')',
                'time' => $c->created_at ? $c->created_at->diffForHumans() : 'Récemment',
                'type' => 'closing',
            ];
        }

        $recentRdv = RendezVous::latest()->take(1)->get();
        foreach ($recentRdv as $r) {
            $activities[] = [
                'name' => $r->prospect,
                'action' => 'RDV planifié (' . $r->heure . ')',
                'time' => $r->created_at ? $r->created_at->diffForHumans() : 'Récemment',
                'type' => 'rdv',
            ];
        }

        return response()->json([
            'prospectsCount' => $prospectsCount,
            'prospectionsCount' => $prospectionsCount,
            'rdvDuJourCount' => $rdvDuJourCount,
            'ventesMoisMontant' => $formattedVentes,
            'activities' => $activities,
        ]);
    }
}
