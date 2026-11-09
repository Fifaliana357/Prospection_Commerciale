<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Commercial;
use App\Models\Livraison;
use App\Models\LivraisonHistorique;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LivraisonController extends Controller
{
    private const STATUSES = ['a_preparer', 'en_cours', 'livree', 'retournee'];

    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => 'nullable|string|max:191',
            'statut' => 'nullable|in:tous,a_preparer,en_cours,livree,retournee,retardee',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);
        $user = $request->user();
        $deliveries = $this->ownedDeliveries($user);

        $summary = [
            'en_retard' => (clone $deliveries)
                ->whereNotIn('livraison.statut', ['livree', 'retournee'])
                ->whereNotNull('livraison.date_prevue')
                ->whereDate('livraison.date_prevue', '<', today())
                ->count(),
            'en_cours' => (clone $deliveries)->where('livraison.statut', 'en_cours')->count(),
            'livrees' => (clone $deliveries)->where('livraison.statut', 'livree')->count(),
        ];

        $query = clone $deliveries;
        if (! empty($validated['search'])) {
            $search = trim($validated['search']);
            $query->where(fn (Builder $matches) => $matches
                ->where('livreur', 'like', "%{$search}%")
                ->orWhereHas('vente', fn (Builder $sales) => $sales
                    ->where('numero', 'like', "%{$search}%")
                    ->orWhereHas('client', fn (Builder $clients) => $clients
                        ->where('nom', 'like', "%{$search}%")
                        ->orWhere('prenom', 'like', "%{$search}%")
                        ->orWhere('entreprise', 'like', "%{$search}%"))));
        }

        $status = $validated['statut'] ?? 'tous';
        if ($status === 'retardee') {
            $query->whereNotIn('livraison.statut', ['livree', 'retournee'])
                ->whereNotNull('livraison.date_prevue')
                ->whereDate('livraison.date_prevue', '<', today());
        } elseif ($status !== 'tous') {
            $query->where('livraison.statut', $status);
            if ($status !== 'livree' && $status !== 'retournee') {
                $query->where(fn (Builder $notLate) => $notLate
                    ->whereNull('livraison.date_prevue')
                    ->orWhereDate('livraison.date_prevue', '>=', today()));
            }
        }

        $page = $query->with([
            'vente:id_vente,id_admin,id_commercial,id_client,numero,date_vente,montant_total',
            'vente.client:id_client,nom,prenom,entreprise,telephone',
            'vente.commercial:id_commercial,nom,prenom',
        ])->orderByRaw("CASE WHEN livraison.statut NOT IN ('livree', 'retournee') AND livraison.date_prevue < ? THEN 0 ELSE 1 END", [today()->toDateString()])
            ->orderBy('livraison.date_prevue')
            ->orderByDesc('livraison.id_livraison')
            ->paginate($request->integer('per_page', 15));

        $page->getCollection()->each(function (Livraison $delivery) {
            $delivery->setAttribute('statut_affiche', $this->displayStatus($delivery));
        });

        return response()->json([
            'summary' => $summary,
            'deliveries' => $page,
        ]);
    }

    public function history(Request $request, int $id)
    {
        $delivery = $this->ownedDeliveries($request->user())->findOrFail($id);

        return response()->json([
            'historique' => $delivery->historique()
                ->with(['admin:id_admin,nom,prenom', 'commercial:id_commercial,nom,prenom'])
                ->get()
                ->map(fn (LivraisonHistorique $entry) => [
                    ...$entry->toArray(),
                    'auteur' => $entry->admin
                        ? trim($entry->admin->prenom.' '.$entry->admin->nom)
                        : ($entry->commercial
                            ? trim($entry->commercial->prenom.' '.$entry->commercial->nom)
                            : 'Système'),
                ]),
        ]);
    }

    public function update(Request $request, int $id)
    {
        $validated = $request->validate([
            'adresse' => 'nullable|string|max:2000',
            'statut' => 'required|in:'.implode(',', self::STATUSES),
            'date_prevue' => 'nullable|date',
            'date_livraison' => 'nullable|date',
            'livreur' => 'nullable|string|max:191',
            'commentaire' => 'nullable|string|max:5000',
        ]);

        $user = $request->user();
        $delivery = DB::transaction(function () use ($user, $id, $validated) {
            $delivery = $this->ownedDeliveries($user)->lockForUpdate()->findOrFail($id);
            $previousStatus = $delivery->statut;
            $nextStatus = $validated['statut'];

            if ($nextStatus === 'livree' && empty($validated['date_livraison'])) {
                $validated['date_livraison'] = now();
            }

            if (in_array($nextStatus, ['a_preparer', 'en_cours'], true)) {
                $validated['date_livraison'] = null;
            }

            $delivery->update([
                'adresse' => $validated['adresse'] ?? null,
                'statut' => $nextStatus,
                'date_prevue' => $validated['date_prevue'] ?? null,
                'date_livraison' => $validated['date_livraison'] ?? null,
                'livreur' => $validated['livreur'] ?? null,
                'commentaire' => $validated['commentaire'] ?? null,
            ]);

            if ($previousStatus !== $nextStatus) {
                LivraisonHistorique::create([
                    'id_livraison' => $delivery->id_livraison,
                    'ancien_statut' => $previousStatus,
                    'nouveau_statut' => $nextStatus,
                    'commentaire' => $validated['commentaire'] ?? null,
                    'id_admin' => $user->id_admin,
                    'id_commercial' => $user instanceof Commercial ? $user->id_commercial : null,
                ]);
            }

            return $delivery->fresh()->load([
                'vente:id_vente,id_admin,id_commercial,id_client,numero,date_vente,montant_total',
                'vente.client:id_client,nom,prenom,entreprise,telephone',
                'vente.commercial:id_commercial,nom,prenom',
            ]);
        });
        $delivery->setAttribute('statut_affiche', $this->displayStatus($delivery));

        return response()->json([
            'message' => 'Informations de livraison mises à jour.',
            'delivery' => $delivery,
        ]);
    }

    private function ownedDeliveries(Admin|Commercial $user): Builder
    {
        return Livraison::query()->whereHas('vente', fn (Builder $sales) => $sales
            ->where('id_admin', $user->id_admin));
    }

    private function displayStatus(Livraison $delivery): string
    {
        if (! in_array($delivery->statut, ['livree', 'retournee'], true)
            && $delivery->date_prevue
            && $delivery->date_prevue->lt(today())) {
            return 'retardee';
        }

        return $delivery->statut;
    }
}
