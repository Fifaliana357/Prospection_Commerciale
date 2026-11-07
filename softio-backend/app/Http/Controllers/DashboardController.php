<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Client;
use App\Models\Closing;
use App\Models\Commercial;
use App\Models\Livraison;
use App\Models\Offre;
use App\Models\Prospection;
use App\Models\RendezVous;
use App\Models\Vente;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'type' => 'nullable|in:all,produit,service',
            'commercial_id' => 'nullable|regex:/^(admin|[0-9]+)$/',
            'offer_id' => 'nullable|integer',
            'period' => 'nullable|in:day,week,month',
            'interest_search' => 'nullable|string|max:191',
            'star_search' => 'nullable|string|max:191',
        ]);

        $user = $request->user();
        $adminId = $user->id_admin;
        $dateFrom = $validated['date_from'] ?? now()->startOfYear()->toDateString();
        $dateTo = $validated['date_to'] ?? now()->toDateString();
        $type = ($validated['type'] ?? 'all') !== 'all' ? $validated['type'] : null;
        $commercialFilter = $validated['commercial_id'] ?? null;
        $offerId = $validated['offer_id'] ?? null;
        if ($commercialFilter === 'admin' && ! $user instanceof Admin) {
            throw ValidationException::withMessages([
                'commercial_id' => 'Le responsable sélectionné est invalide.',
            ]);
        }
        $adminSales = $user instanceof Admin && $commercialFilter === 'admin';
        $commercialId = $user instanceof Admin
            ? ($commercialFilter !== null && ! $adminSales ? (int) $commercialFilter : null)
            : $user->id_commercial;

        if ($commercialId !== null && ! Commercial::query()
            ->where('id_admin', $adminId)
            ->whereKey($commercialId)
            ->exists()) {
            throw ValidationException::withMessages([
                'commercial_id' => 'Le responsable sélectionné est invalide.',
            ]);
        }
        if ($offerId !== null && (! Schema::hasTable('offre') || ! Offre::query()
            ->where('id_admin', $adminId)
            ->whereKey($offerId)
            ->exists())) {
            throw ValidationException::withMessages([
                'offer_id' => 'L’offre sélectionnée est invalide.',
            ]);
        }

        $scopeCommercial = fn (Builder $query) => $query
            ->where('id_admin', $adminId)
            ->when($commercialId !== null, fn (Builder $builder) => $builder
                ->where('id_commercial', $commercialId))
            ->when($adminSales, fn (Builder $builder) => $builder->whereNull('id_commercial'))
            ->when(! $user instanceof Admin && $commercialId === null, fn (Builder $builder) => $builder
                ->where('id_commercial', $user->id_commercial));

        $allSales = fn () => Vente::query()
            ->where('vente.id_admin', $adminId)
            ->when($commercialId !== null, fn (Builder $query) => $query
                ->where('vente.id_commercial', $commercialId))
            ->when($adminSales, fn (Builder $query) => $query->whereNull('vente.id_commercial'))
            ->when(! $user instanceof Admin && $commercialId === null, fn (Builder $query) => $query
                ->where('vente.id_commercial', $user->id_commercial))
            ->when($type !== null, fn (Builder $query) => $query->whereHas('lignes', fn (Builder $lines) => $lines
                ->where('type_ligne', $type)))
            ->whereRaw('DATE(COALESCE(vente.date_vente, vente.created_at)) BETWEEN ? AND ?', [$dateFrom, $dateTo]);

        $sales = fn () => $allSales()
            ->where(fn (Builder $query) => $query
                ->whereNull('vente.statut')
                ->orWhereNotIn('vente.statut', ['brouillon', 'annulee']));

        $lineSales = fn () => DB::table('ligne_vente')
            ->join('vente', 'vente.id_vente', '=', 'ligne_vente.id_vente')
            ->where('vente.id_admin', $adminId)
            ->when($commercialId !== null, fn ($query) => $query->where('vente.id_commercial', $commercialId))
            ->when($adminSales, fn ($query) => $query->whereNull('vente.id_commercial'))
            ->when(! $user instanceof Admin && $commercialId === null, fn ($query) => $query
                ->where('vente.id_commercial', $user->id_commercial))
            ->where(fn ($query) => $query
                ->whereNull('vente.statut')
                ->orWhereNotIn('vente.statut', ['brouillon', 'annulee']))
            ->whereRaw('DATE(COALESCE(vente.date_vente, vente.created_at)) BETWEEN ? AND ?', [$dateFrom, $dateTo])
            ->when($type !== null, fn ($query) => $query->where('ligne_vente.type_ligne', $type));

        $salesForSummary = $sales();
        $countableSales = $allSales()->where(fn (Builder $query) => $query
            ->whereNull('vente.statut')
            ->orWhere('vente.statut', '!=', 'annulee'));
        $salesCount = (clone $countableSales)->count();
        $clientsWithSales = (clone $salesForSummary)->distinct()->count('vente.id_client');
        $unvalidatedCount = (clone $countableSales)
            ->where(fn (Builder $query) => $query
                ->whereNull('vente.statut')
                ->orWhere('vente.statut', '!=', 'validee'))
            ->count();

        if ($type === null) {
            $revenue = (float) (clone $salesForSummary)
                ->sum(DB::raw('COALESCE(vente.montant_ttc, vente.montant_total, 0)'));
        } else {
            $revenue = (float) $lineSales()->sum('ligne_vente.montant');
        }

        $period = $validated['period'] ?? 'month';
        $periodExpression = match ($period) {
            'day' => "DATE(COALESCE(vente.date_vente, vente.created_at))",
            'week' => "YEARWEEK(COALESCE(vente.date_vente, vente.created_at), 3)",
            default => "DATE_FORMAT(COALESCE(vente.date_vente, vente.created_at), '%Y-%m')",
        };

        if ($type === null) {
            $trend = (clone $salesForSummary)
                ->selectRaw("{$periodExpression} as periode")
                ->selectRaw('SUM(COALESCE(vente.montant_ttc, vente.montant_total, 0)) as total')
                ->groupBy('periode')
                ->orderBy('periode')
                ->get();
        } else {
            $trend = $lineSales()
                ->selectRaw("{$periodExpression} as periode")
                ->selectRaw('SUM(ligne_vente.montant) as total')
                ->groupBy('periode')
                ->orderBy('periode')
                ->get();
        }
        $trendByPeriod = $trend->keyBy(fn ($point) => (string) $point->periode);
        $trendStart = CarbonImmutable::parse($dateFrom);
        $trendEnd = CarbonImmutable::parse($dateTo);
        if ($period === 'week') {
            $trendStart = $trendStart->startOfWeek();
            $trendEnd = $trendEnd->startOfWeek();
        } elseif ($period === 'month') {
            $trendStart = $trendStart->startOfMonth();
            $trendEnd = $trendEnd->startOfMonth();
        }
        $trend = collect();
        for ($cursor = $trendStart; $cursor <= $trendEnd; $cursor = match ($period) {
            'day' => $cursor->addDay(),
            'week' => $cursor->addWeek(),
            default => $cursor->addMonth(),
        }) {
            $key = match ($period) {
                'day' => $cursor->format('Y-m-d'),
                'week' => $cursor->format('oW'),
                default => $cursor->format('Y-m'),
            };
            $trend->push([
                'periode' => $key,
                'total' => (float) ($trendByPeriod->get($key)->total ?? 0),
            ]);
        }

        $topProducts = $lineSales()
            ->select('ligne_vente.designation')
            ->selectRaw('SUM(ligne_vente.montant) as total')
            ->selectRaw('SUM(ligne_vente.quantite) as qte')
            ->groupBy('ligne_vente.designation')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        $topClientsQuery = $type === null
            ? $sales()->join('client', 'client.id_client', '=', 'vente.id_client')
            : $lineSales()->join('client', 'client.id_client', '=', 'vente.id_client');
        $topClients = $topClientsQuery
            ->select('vente.id_client', 'client.nom', 'client.prenom', 'client.entreprise')
            ->selectRaw($type === null
                ? 'SUM(COALESCE(vente.montant_ttc, vente.montant_total, 0)) as total'
                : 'SUM(ligne_vente.montant) as total')
            ->selectRaw('COUNT(DISTINCT vente.id_vente) as nb_ventes')
            ->groupBy(
                'vente.id_client',
                'client.nom',
                'client.prenom',
                'client.entreprise',
            )
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($client) => [
                'id_client' => $client->id_client,
                'nom_client' => trim($client->entreprise ?: trim(($client->prenom ?? '') . ' ' . ($client->nom ?? ''))),
                'total' => (float) $client->total,
                'nb_ventes' => (int) $client->nb_ventes,
            ]);

        $distribution = $lineSales()
            ->select('ligne_vente.type_ligne')
            ->selectRaw('SUM(ligne_vente.montant) as total')
            ->groupBy('ligne_vente.type_ligne')
            ->get();

        $baseClients = Client::query()->where('id_admin', $adminId)
            ->when($adminSales, fn (Builder $query) => $query->whereNull('id_commercial'))
            ->when(! $user instanceof Admin, fn (Builder $query) => $query
                ->where('id_commercial', $user->id_commercial));
        $prospects = (clone $baseClients)->count();

        $prospectionsQuery = Prospection::query();
        $scopeCommercial($prospectionsQuery);
        $totalProspections = (clone $prospectionsQuery)->count();
        $enCours = (clone $prospectionsQuery)
            ->where(fn (Builder $query) => $query->whereNull('etat')->orWhere('etat', '!=', 'cloture'))
            ->where(fn (Builder $query) => $query->where('est_perdu', false)->orWhereNull('est_perdu'))
            ->count();

        $closingsQuery = Closing::query();
        $scopeCommercial($closingsQuery);
        $totalClosings = Schema::hasTable('closing') ? $closingsQuery->count() : 0;

        $appointmentsQuery = RendezVous::query();
        $scopeCommercial($appointmentsQuery);
        $appointmentsToday = Schema::hasTable('rendez_vous')
            ? $appointmentsQuery->whereDate('date_rdv', today())->count()
            : 0;

        $lateDeliveries = Livraison::query()
            ->whereNotIn('livraison.statut', ['livree', 'retournee'])
            ->whereNotNull('livraison.date_prevue')
            ->whereDate('livraison.date_prevue', '<', today())
            ->whereHas('vente', fn (Builder $sales) => $sales
                ->where('vente.id_admin', $adminId)
                ->when($commercialId !== null, fn (Builder $query) => $query
                    ->where('vente.id_commercial', $commercialId))
                ->when($adminSales, fn (Builder $query) => $query->whereNull('vente.id_commercial'))
                ->when(! $user instanceof Admin && $commercialId === null, fn (Builder $query) => $query
                    ->where('vente.id_commercial', $user->id_commercial)))
            ->count();

        $messageScores = collect();
        $messagesByOffer = collect();
        $messagesByResponsible = collect();
        if (Schema::hasTable('proposition') && Schema::hasColumn('proposition', 'note')) {
            $messageQuery = DB::table('proposition')
                ->join('prospection', 'prospection.id_prospection', '=', 'proposition.id_prospection')
                ->where('prospection.id_admin', $adminId)
                ->when($commercialId !== null, fn ($query) => $query->where('prospection.id_commercial', $commercialId))
                ->when($adminSales, fn ($query) => $query->whereNull('prospection.id_commercial'))
                ->when(! $user instanceof Admin && $commercialId === null, fn ($query) => $query
                    ->where('prospection.id_commercial', $user->id_commercial))
                ->whereBetween(DB::raw('DATE(proposition.date_proposition)'), [$dateFrom, $dateTo])
                ->whereNotNull('proposition.note')
                ->when($offerId !== null, fn ($query) => $query->where('prospection.id_offre', $offerId));
            $messageScores = (clone $messageQuery)
                ->select('proposition.note')
                ->selectRaw('COUNT(*) as total')
                ->groupBy('proposition.note')
                ->orderBy('proposition.note')
                ->get();

            if (Schema::hasTable('offre') && Schema::hasColumn('prospection', 'id_offre')) {
                $messagesByOffer = (clone $messageQuery)
                    ->leftJoin('offre', 'offre.id_offre', '=', 'prospection.id_offre')
                    ->selectRaw("COALESCE(NULLIF(offre.denomination, ''), 'Sans offre') as label")
                    ->selectRaw('COUNT(*) as total')
                    ->selectRaw('AVG(proposition.note) as average')
                    ->groupBy('offre.denomination')
                    ->orderByDesc('total')
                    ->get();
            }

            if (Schema::hasTable('commercial')) {
                $messagesByResponsible = (clone $messageQuery)
                    ->leftJoin('commercial', 'commercial.id_commercial', '=', 'prospection.id_commercial')
                    ->selectRaw("COALESCE(NULLIF(TRIM(CONCAT(commercial.prenom, ' ', commercial.nom)), ''), 'Admin') as label")
                    ->selectRaw('COUNT(*) as total')
                    ->selectRaw('AVG(proposition.note) as average')
                    ->groupBy('prospection.id_commercial', 'commercial.prenom', 'commercial.nom')
                    ->orderByDesc('total')
                    ->get();
            }
        }

        $interestRatings = collect();
        if (Schema::hasTable('interet')) {
            $interestQuery = DB::table('interet')
                ->join('client', 'client.id_client', '=', 'interet.id_client')
                ->where('client.id_admin', $adminId)
                ->when($adminSales, fn ($query) => $query->whereNull('client.id_commercial'))
                ->when(! $user instanceof Admin, fn ($query) => $query
                    ->where('client.id_commercial', $user->id_commercial))
                ->whereBetween(DB::raw('DATE(interet.created_at)'), [$dateFrom, $dateTo])
                ->when(! empty($validated['interest_search']), fn ($query) => $query
                    ->where('interet.produit_concerne', 'like', '%' . trim($validated['interest_search']) . '%'));
            $interestRatings = $interestQuery
                ->select('interet.produit_concerne')
                ->selectRaw('SUM(CASE WHEN interet.niveau >= 4 THEN 1 ELSE 0 END) as tres_interesse')
                ->selectRaw('SUM(CASE WHEN interet.niveau = 3 THEN 1 ELSE 0 END) as moyennement_interesse')
                ->selectRaw('SUM(CASE WHEN interet.niveau BETWEEN 1 AND 2 THEN 1 ELSE 0 END) as peu_interesse')
                ->selectRaw('SUM(CASE WHEN interet.niveau = 0 THEN 1 ELSE 0 END) as pas_interesse')
                ->selectRaw('COUNT(*) as total')
                ->groupBy('interet.produit_concerne')
                ->orderByDesc('total')
                ->orderBy('interet.produit_concerne')
                ->get();
        }

        $prospectionStarSummary = [
            'total' => 0,
            'rated' => 0,
            'average' => null,
            'four_or_five_stars' => 0,
            'distribution' => collect(),
            'by_offer' => collect(),
            'by_responsible' => collect(),
        ];
        if (Schema::hasTable('prospection') && Schema::hasColumn('prospection', 'note_actuelle')) {
            $starQuery = DB::table('prospection')
                ->leftJoin('offre', 'offre.id_offre', '=', 'prospection.id_offre')
                ->where('prospection.id_admin', $adminId)
                ->when($commercialId !== null, fn ($query) => $query->where('prospection.id_commercial', $commercialId))
                ->when($adminSales, fn ($query) => $query->whereNull('prospection.id_commercial'))
                ->when(! $user instanceof Admin && $commercialId === null, fn ($query) => $query
                    ->where('prospection.id_commercial', $user->id_commercial))
                ->whereBetween(DB::raw('DATE(prospection.created_at)'), [$dateFrom, $dateTo])
                ->when($offerId !== null, fn ($query) => $query->where('prospection.id_offre', $offerId))
                ->when(! empty($validated['star_search']), fn ($query) => $query->where(function ($searchQuery) use ($validated) {
                    $search = trim($validated['star_search']);
                    $searchQuery->where('offre.denomination', 'like', '%' . $search . '%')
                        ->orWhere('prospection.produit_prospecte', 'like', '%' . $search . '%');
                }));

            $summary = (clone $starQuery)
                ->selectRaw('COUNT(*) as total')
                ->selectRaw('SUM(CASE WHEN COALESCE(prospection.note_actuelle, 0) > 0 THEN 1 ELSE 0 END) as rated')
                ->selectRaw('AVG(NULLIF(LEAST(prospection.note_actuelle, 4), 0)) as average')
                ->selectRaw('SUM(CASE WHEN prospection.note_actuelle >= 4 THEN 1 ELSE 0 END) as four_or_five_stars')
                ->first();

            $prospectionStarSummary['total'] = (int) ($summary->total ?? 0);
            $prospectionStarSummary['rated'] = (int) ($summary->rated ?? 0);
            $prospectionStarSummary['average'] = $summary->average === null ? null : (float) $summary->average;
            $prospectionStarSummary['four_or_five_stars'] = (int) ($summary->four_or_five_stars ?? 0);
            $prospectionStarSummary['distribution'] = (clone $starQuery)
                ->selectRaw('COALESCE(prospection.note_actuelle, 0) as note')
                ->selectRaw('COUNT(*) as total')
                ->groupBy('prospection.note_actuelle')
                ->orderBy('prospection.note_actuelle')
                ->get();
            $prospectionStarSummary['by_offer'] = (clone $starQuery)
                ->selectRaw("COALESCE(NULLIF(offre.denomination, ''), NULLIF(prospection.produit_prospecte, ''), 'Sans offre') as label")
                ->selectRaw('SUM(CASE WHEN prospection.note_actuelle >= 4 THEN 1 ELSE 0 END) as interested')
                ->selectRaw('SUM(CASE WHEN prospection.note_actuelle = 3 THEN 1 ELSE 0 END) as medium')
                ->selectRaw('SUM(CASE WHEN prospection.note_actuelle = 2 THEN 1 ELSE 0 END) as neutral')
                ->selectRaw('SUM(CASE WHEN prospection.note_actuelle = 1 THEN 1 ELSE 0 END) as not_interested')
                ->selectRaw('SUM(CASE WHEN COALESCE(prospection.note_actuelle, 0) = 0 THEN 1 ELSE 0 END) as not_rated')
                ->selectRaw('COUNT(*) as total')
                ->groupByRaw("COALESCE(NULLIF(offre.denomination, ''), NULLIF(prospection.produit_prospecte, ''), 'Sans offre')")
                ->orderBy('label')
                ->get();
            $prospectionStarSummary['by_responsible'] = (clone $starQuery)
                ->leftJoin('commercial', 'commercial.id_commercial', '=', 'prospection.id_commercial')
                ->selectRaw("COALESCE(NULLIF(TRIM(CONCAT(commercial.prenom, ' ', commercial.nom)), ''), 'Admin') as label")
                ->selectRaw('SUM(CASE WHEN prospection.note_actuelle >= 4 THEN 1 ELSE 0 END) as interested')
                ->selectRaw('SUM(CASE WHEN prospection.note_actuelle = 3 THEN 1 ELSE 0 END) as medium')
                ->selectRaw('SUM(CASE WHEN prospection.note_actuelle = 2 THEN 1 ELSE 0 END) as neutral')
                ->selectRaw('SUM(CASE WHEN prospection.note_actuelle = 1 THEN 1 ELSE 0 END) as not_interested')
                ->selectRaw('SUM(CASE WHEN COALESCE(prospection.note_actuelle, 0) = 0 THEN 1 ELSE 0 END) as not_rated')
                ->selectRaw('COUNT(*) as total')
                ->groupBy('prospection.id_commercial', 'commercial.prenom', 'commercial.nom')
                ->orderBy('label')
                ->get();
        }

        if ($user instanceof Admin) {
            $responsables = collect([[
                'id_commercial' => null,
                'nom' => 'Admin',
                'prenom' => null,
            ]])->concat(Commercial::query()
                ->where('id_admin', $adminId)
                ->orderBy('nom')
                ->get(['id_commercial', 'nom', 'prenom']));
        } else {
            $responsables = collect([[
                'id_commercial' => $user->id_commercial,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
            ]]);
        }

        return response()->json([
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'type' => $type ?? 'all',
                'commercial_id' => $adminSales ? 'admin' : $commercialId,
                    'offer_id' => $offerId,
                'period' => $period,
            ],
            'responsables' => $responsables,
                'offres' => Schema::hasTable('offre')
                    ? Offre::query()->where('id_admin', $adminId)->orderBy('denomination')->get(['id_offre', 'denomination'])
                    : collect(),
            'prospects' => $prospects,
            'prospections' => $totalProspections,
            'en_cours' => $enCours,
            'closings' => $totalClosings,
            'rdv_aujourdhui' => $appointmentsToday,
            'livraisons_en_retard' => $lateDeliveries,
            'chiffre_affaires' => $revenue,
            'nombre_ventes' => $salesCount,
            'clients_avec_achat' => $clientsWithSales,
            'ventes_non_validees' => $unvalidatedCount,
            'evolution' => $trend,
            'top_produits' => $topProducts,
            'top_clients' => $topClients,
            'repartition' => $distribution,
            'scoring_messages' => $messageScores,
            'scoring_by_offer' => $messagesByOffer,
            'scoring_by_responsible' => $messagesByResponsible,
            'prospection_star_summary' => $prospectionStarSummary,
            'interets_par_etoile' => $interestRatings,
        ]);
    }
}
