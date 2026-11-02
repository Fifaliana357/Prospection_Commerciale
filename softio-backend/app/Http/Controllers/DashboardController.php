<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Prospection;
use App\Models\Closing;
use App\Models\RendezVous;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $prospectsQuery = Client::query();
        $prospectionsQuery = Prospection::query();
        $closingsQuery = Closing::query();
        $rdvQuery = RendezVous::query();

        // Filtre admin / commercial si besoin
        if ($user instanceof \App\Models\Admin) {
            // optionnel : $prospectionsQuery->where('id_admin', $user->id_admin);
        } elseif ($user instanceof \App\Models\Commercial) {
            $prospectionsQuery->where('id_commercial', $user->id_commercial);
            $closingsQuery->where('id_commercial', $user->id_commercial);
            $rdvQuery->where('id_commercial', $user->id_commercial);
        }

        $totalProspects = (clone $prospectsQuery)->count();
        $totalProspections = (clone $prospectionsQuery)->count();
        $enCours = (clone $prospectionsQuery)
            ->where('etat', '!=', 'cloture')
            ->where('est_perdu', false)
            ->count();
        $cloturees = (clone $prospectionsQuery)->where('etat', 'cloture')->count();
        $perdues = (clone $prospectionsQuery)->where('est_perdu', true)->count();
        $totalClosings = (clone $closingsQuery)->count();
        $montantClosings = (clone $closingsQuery)->sum('montant');

        $today = Carbon::today();
        $rdvAujourdhui = (clone $rdvQuery)->whereDate('date_rdv', $today)->count();
        $rdvSemaine = (clone $rdvQuery)
            ->whereBetween('date_rdv', [$today->copy()->startOfWeek(), $today->copy()->endOfWeek()])
            ->count();

        $tauxConversion = $totalProspections > 0
            ? round(($cloturees / $totalProspections) * 100, 1)
            : 0;

        return response()->json([
            'prospects'        => $totalProspects,
            'prospections'     => $totalProspections,
            'en_cours'         => $enCours,
            'cloturees'        => $cloturees,
            'perdues'          => $perdues,
            'closings'         => $totalClosings,
            'montant_closings' => (float) $montantClosings,
            'rdv_aujourdhui'   => $rdvAujourdhui,
            'rdv_semaine'      => $rdvSemaine,
            'taux_conversion'  => $tauxConversion,
        ]);
    }
}
