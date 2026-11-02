<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Client;
use App\Models\Commercial;
use App\Models\Devis;
use App\Models\LigneVente;
use App\Models\Produit;
use App\Models\Offre;
use App\Models\StockMouvement;
use App\Models\Vente;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VenteController extends Controller
{
    public function catalog(Request $request): JsonResponse
    {
        $user = $request->user();
        $products = Produit::query()
            ->where('id_admin', $user->id_admin)
            ->where('actif', true)
            ->withSum([
                'mouvementsStock as quantite_approvisionnee' => fn (Builder $query) => $query
                    ->where('type_mouvement', 'entree'),
            ], 'quantite')
            ->withSum([
                'mouvementsStock as quantite_sortie' => fn (Builder $query) => $query
                    ->where('type_mouvement', 'sortie'),
            ], 'quantite')
            ->orderBy('designation')
            ->get()
            ->map(fn (Produit $product) => [
                'id_produit' => $product->id_produit,
                'reference' => $product->reference,
                'designation' => $product->designation,
                'prix_unitaire' => (int) $product->prix_unitaire,
                'stock_disponible' => (int) $product->quantite_approvisionnee - (int) $product->quantite_sortie,
            ]);

        $clients = Client::query()
            ->where('id_admin', $user->id_admin)
            ->when(! $user instanceof Admin, fn (Builder $query) => $query
                ->where('id_commercial', $user->id_commercial))
            ->orderBy('nom')
            ->get(['id_client', 'nom', 'prenom', 'entreprise', 'email', 'telephone']);

        $services = Offre::query()
            ->where('id_admin', $user->id_admin)
            ->where('actif', true)
            ->orderBy('denomination')
            ->get(['id_offre', 'denomination', 'description', 'tarif']);

        return response()->json([
            'clients' => $clients,
            'produits' => $products,
            'services' => $services,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = $this->ownedSales($request->user())
            ->with(['client:id_client,nom,prenom,entreprise', 'commercial:id_commercial,nom,prenom'])
            ->with('lignes')
            ->withCount('lignes');

        if ($request->query('view') === 'brouillons') {
            $query->where('statut', 'brouillon');
        } else {
            $query->where('statut', '!=', 'brouillon');
        }

        if ($request->filled('type') && in_array($request->query('type'), ['produit', 'service'], true)) {
            $query->whereHas('lignes', fn (Builder $lines) => $lines
                ->where('type_ligne', $request->query('type')));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where(function (Builder $builder) use ($search) {
                $builder->where('numero', 'like', "%{$search}%")
                    ->orWhereHas('client', fn (Builder $clientQuery) => $clientQuery
                        ->where('nom', 'like', "%{$search}%")
                        ->orWhere('prenom', 'like', "%{$search}%")
                        ->orWhere('entreprise', 'like', "%{$search}%"));
            });
        }

        $query->when($request->filled('date_from'), fn (Builder $builder) => $builder
            ->where(fn (Builder $dateQuery) => $dateQuery
                ->whereDate('date_vente', '>=', $request->query('date_from'))
                ->orWhere(fn (Builder $legacyQuery) => $legacyQuery
                    ->whereNull('date_vente')
                    ->whereDate('created_at', '>=', $request->query('date_from')))))
            ->when($request->filled('date_to'), fn (Builder $builder) => $builder
                ->where(fn (Builder $dateQuery) => $dateQuery
                    ->whereDate('date_vente', '<=', $request->query('date_to'))
                    ->orWhere(fn (Builder $legacyQuery) => $legacyQuery
                        ->whereNull('date_vente')
                        ->whereDate('created_at', '<=', $request->query('date_to')))));

        $perPage = min(max($request->integer('per_page', 10), 1), 100);
        $sales = $query->orderByDesc('date_vente')->orderByDesc('id_vente')->paginate($perPage);
        $sales->getCollection()->each(function (Vente $sale) {
            if (! $sale->numero) {
                $sale->numero = ($sale->date_vente?->format('Y') ?? $sale->created_at?->format('Y') ?? now()->format('Y'))
                    . '-' . str_pad((string) $sale->id_vente, 4, '0', STR_PAD_LEFT);
            }
        });

        return response()->json($sales);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request);
        $sale = DB::transaction(function () use ($request, $validated) {
            $sale = $this->saveSale($request->user(), $validated);
            if (($validated['statut'] ?? 'brouillon') === 'validee') {
                $this->validateSale($sale);
            }

            return $sale->fresh()->load(['client', 'commercial', 'lignes']);
        });

        return response()->json([
            'message' => $sale->statut === 'brouillon' ? 'Brouillon enregistré.' : 'Vente validée et stock mis à jour.',
            'vente' => $sale,
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $sale = $this->ownedSales($request->user())
            ->with([
                'client',
                'commercial',
                'lignes.produit:id_produit,reference',
                'lignes.offre:id_offre,denomination',
                'devis:id_devis,numero,type,statut',
            ])
            ->findOrFail($id);

        return response()->json($sale);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $this->validatePayload($request);
        $sale = DB::transaction(function () use ($request, $id, $validated) {
            $sale = $this->ownedSales($request->user())
                ->lockForUpdate()
                ->findOrFail($id);

            if ($sale->statut !== 'brouillon') {
                abort(response()->json(['message' => 'Seuls les brouillons peuvent être modifiés.'], 422));
            }

            $sale = $this->saveSale($request->user(), $validated, $sale);
            if (($validated['statut'] ?? 'brouillon') === 'validee') {
                $this->validateSale($sale);
            }

            return $sale->fresh()->load(['client', 'commercial', 'lignes']);
        });

        return response()->json([
            'message' => $sale->statut === 'brouillon' ? 'Brouillon mis à jour.' : 'Vente validée et stock mis à jour.',
            'vente' => $sale,
        ]);
    }

    public function validateDocument(Request $request, int $id): JsonResponse
    {
        $sale = DB::transaction(function () use ($request, $id) {
            $sale = $this->ownedSales($request->user())
                ->with('lignes')
                ->lockForUpdate()
                ->findOrFail($id);

            if ($sale->statut !== 'brouillon') {
                abort(response()->json(['message' => 'Cette vente est déjà validée.'], 422));
            }

            $this->validateSale($sale);

            return $sale->fresh()->load(['client', 'commercial', 'lignes']);
        });

        return response()->json(['message' => 'Vente validée et stock mis à jour.', 'vente' => $sale]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $sale = $this->ownedSales($request->user())->findOrFail($id);
        if ($sale->statut !== 'brouillon') {
            return response()->json(['message' => 'Seuls les brouillons peuvent être supprimés.'], 422);
        }

        $sale->delete();

        return response()->json(['message' => 'Brouillon supprimé.']);
    }

    public function createInvoice(Request $request, int $id): JsonResponse
    {
        $invoice = DB::transaction(function () use ($request, $id) {
            $sale = $this->ownedSales($request->user())
                ->with('lignes')
                ->lockForUpdate()
                ->findOrFail($id);

            if ($sale->statut === 'brouillon') {
                abort(response()->json(['message' => 'Validez la vente avant de créer sa facture.'], 422));
            }

            if ($sale->id_devis) {
                return Devis::query()->where('id_admin', $sale->id_admin)->findOrFail($sale->id_devis);
            }

            $invoice = Devis::create([
                'id_admin' => $sale->id_admin,
                'id_commercial' => $sale->id_commercial,
                'id_client' => $sale->id_client,
                'numero' => (string) Str::uuid(),
                'type' => 'facture',
                'date_devis' => $sale->date_vente?->toDateString() ?? now()->toDateString(),
                'intitule' => $sale->intitule,
                'montant_ht' => $sale->montant_ht ?? $sale->montant_total,
                'montant_ttc' => $sale->montant_ttc ?? $sale->montant_total,
                'inclure_tva' => $sale->inclure_tva ?? false,
                'taux_tva' => $sale->taux_tva ?? 20,
                'statut' => 'valide',
                'methode_paiement' => $sale->methode_paiement,
                'modalites' => $sale->modalites,
                'remarque' => $sale->remarque,
            ]);
            $invoice->update(['numero' => 'FAC-' . ($sale->numero ?: $sale->id_vente)]);

            foreach ($sale->lignes as $line) {
                $invoice->lignes()->create([
                    'id_produit' => $line->id_produit,
                    'id_offre' => $line->id_offre,
                    'type_ligne' => $line->type_ligne,
                    'designation' => $line->designation,
                    'description' => $line->description,
                    'quantite' => $line->quantite,
                    'prix_unitaire' => $line->prix_unitaire,
                    'remise' => $line->remise,
                    'montant' => $line->montant,
                    'ordre' => $line->ordre,
                ]);
            }

            $sale->update(['id_devis' => $invoice->id_devis]);

            return $invoice->load(['client', 'lignes']);
        });

        return response()->json([
            'message' => 'Facture créée à partir de la vente.',
            'facture' => $invoice,
        ]);
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'id_client' => 'required|integer|exists:client,id_client',
            'date_vente' => 'required|date',
            'intitule' => 'nullable|string|max:255',
            'remarque' => 'nullable|string',
            'inclure_tva' => 'required|boolean',
            'taux_tva' => 'required|numeric|min:0|max:100',
            'methode_paiement' => 'nullable|string|max:100',
            'modalites' => 'nullable|string',
            'statut' => 'nullable|in:brouillon,validee',
            'lignes' => 'required|array|min:1',
            'lignes.*.type_ligne' => 'required|in:produit,service',
            'lignes.*.id_produit' => 'nullable|integer|exists:produit,id_produit',
            'lignes.*.id_offre' => 'nullable|integer|exists:offre,id_offre',
            'lignes.*.quantite' => 'required|integer|min:1',
            'lignes.*.remise' => 'nullable|integer|min:0',
        ]);
    }

    private function saveSale(Admin|Commercial $user, array $validated, ?Vente $sale = null): Vente
    {
        $client = $this->ownedClients($user)->findOrFail($validated['id_client']);
        $lineData = [];
        $subtotal = 0;

        foreach ($validated['lignes'] as $index => $line) {
            $type = $line['type_ligne'];
            if ($type === 'produit') {
                if (empty($line['id_produit']) || ! empty($line['id_offre'])) {
                    abort(response()->json(['message' => 'Sélectionnez un produit pour cette ligne.'], 422));
                }
                $item = Produit::query()
                    ->where('id_admin', $user->id_admin)
                    ->where('actif', true)
                    ->findOrFail($line['id_produit']);
                $designation = $item->designation;
                $description = $item->description;
                $unitPrice = (int) $item->prix_unitaire;
                $productId = $item->id_produit;
                $offerId = null;
            } else {
                if (empty($line['id_offre']) || ! empty($line['id_produit'])) {
                    abort(response()->json(['message' => 'Sélectionnez un service pour cette ligne.'], 422));
                }
                $item = Offre::query()
                    ->where('id_admin', $user->id_admin)
                    ->where('actif', true)
                    ->findOrFail($line['id_offre']);
                $designation = $item->denomination;
                $description = $item->description;
                $unitPrice = (int) $item->tarif;
                $productId = null;
                $offerId = $item->id_offre;
            }

            $gross = $unitPrice * (int) $line['quantite'];
            $discount = (int) ($line['remise'] ?? 0);
            if ($discount > $gross) {
                abort(response()->json(['message' => "La remise dépasse le montant de la ligne « {$designation} »."], 422));
            }

            $amount = $gross - $discount;
            $subtotal += $amount;
            $lineData[] = [
                'id_produit' => $productId,
                'id_offre' => $offerId,
                'type_ligne' => $type,
                'designation' => $designation,
                'description' => $description,
                'quantite' => $line['quantite'],
                'prix_unitaire' => $unitPrice,
                'remise' => $discount,
                'montant' => $amount,
                'ordre' => $index,
            ];
        }

        $taxIncluded = (bool) $validated['inclure_tva'];
        $taxRate = (float) $validated['taux_tva'];
        $total = $subtotal + ($taxIncluded ? (int) round($subtotal * $taxRate / 100) : 0);
        $date = $validated['date_vente'];
        $attributes = [
            'id_admin' => $user->id_admin,
            'id_commercial' => $user instanceof Commercial ? $user->id_commercial : null,
            'id_client' => $client->id_client,
            'date_vente' => $date,
            'intitule' => $validated['intitule'] ?? null,
            'remarque' => $validated['remarque'] ?? null,
            'montant_ht' => $subtotal,
            'montant_ttc' => $total,
            'montant_total' => $total,
            'inclure_tva' => $taxIncluded,
            'taux_tva' => $taxRate,
            'methode_paiement' => $validated['methode_paiement'] ?? null,
            'modalites' => $validated['modalites'] ?? null,
        ];

        if ($sale) {
            $sale->update($attributes);
            $sale->lignes()->delete();
        } else {
            $sale = Vente::create([
                ...$attributes,
                'numero' => (string) Str::uuid(),
                'statut' => 'brouillon',
            ]);
            $sale->update([
                'numero' => Carbon::parse($date)->format('Y') . '-'
                    . str_pad((string) $sale->id_vente, 4, '0', STR_PAD_LEFT),
            ]);
        }

        $sale->lignes()->createMany($lineData);
        if ($sale->statut !== 'brouillon') {
            $sale->update(['statut' => 'brouillon']);
        }

        return $sale;
    }

    private function validateSale(Vente $sale): void
    {
        $quantities = [];
        foreach ($sale->lignes as $line) {
            if ($line->type_ligne === 'produit' && $line->id_produit) {
                $quantities[$line->id_produit] = ($quantities[$line->id_produit] ?? 0) + (int) $line->quantite;
            }
        }

        foreach ($quantities as $productId => $quantity) {
            $product = Produit::query()
                ->where('id_admin', $sale->id_admin)
                ->lockForUpdate()
                ->findOrFail($productId);
            $availableStock = (int) $product->mouvementsStock()
                ->where('type_mouvement', 'entree')
                ->sum('quantite')
                - (int) $product->mouvementsStock()
                    ->where('type_mouvement', 'sortie')
                    ->sum('quantite');

            if ($availableStock < $quantity) {
                abort(response()->json([
                    'message' => "Stock insuffisant pour {$product->designation}.",
                    'stock_actuel' => $availableStock,
                ], 422));
            }
        }

        foreach ($quantities as $productId => $quantity) {
            StockMouvement::create([
                'id_produit' => $productId,
                'id_admin' => $sale->id_admin,
                'id_commercial' => $sale->id_commercial,
                'type_mouvement' => 'sortie',
                'quantite' => $quantity,
                'reference' => 'VENTE-' . $sale->id_vente,
                'commentaire' => 'Déduction automatique suite à la validation de la vente ' . $sale->numero . '.',
                'date_mouvement' => now(),
            ]);
        }

        $sale->update(['statut' => 'validee']);
    }

    private function ownedSales(Admin|Commercial $user): Builder
    {
        $query = Vente::query()->where('id_admin', $user->id_admin);
        if (! $user instanceof Admin) {
            $query->where('id_commercial', $user->id_commercial);
        }

        return $query;
    }

    private function ownedClients(Admin|Commercial $user): Builder
    {
        $query = Client::query()->where('id_admin', $user->id_admin);
        if (! $user instanceof Admin) {
            $query->where('id_commercial', $user->id_commercial);
        }

        return $query;
    }
}
