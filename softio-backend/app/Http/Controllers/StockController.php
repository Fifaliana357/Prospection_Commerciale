<?php

namespace App\Http\Controllers;

use App\Models\Produit;
use App\Models\StockMouvement;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockController extends Controller
{
    public function inventory(Request $request): JsonResponse
    {
        $user = $request->user();
        $search = trim((string) $request->query('search', ''));
        $products = Produit::query()
            ->where('id_admin', $user->id_admin)
            ->withSum([
                'mouvementsStock as quantite_approvisionnee' => fn (Builder $query) => $query
                    ->where('type_mouvement', 'entree'),
            ], 'quantite')
            ->withSum([
                'mouvementsStock as quantite_sortie' => fn (Builder $query) => $query
                    ->where('type_mouvement', 'sortie'),
            ], 'quantite')
            ->withSum([
                'mouvementsStock as quantite_vendue' => fn (Builder $query) => $query
                    ->where('type_mouvement', 'sortie')
                    ->where('reference', 'like', 'VENTE-%'),
            ], 'quantite');

        $summaryProducts = (clone $products)->get();
        $totalValue = $summaryProducts->sum(function (Produit $product): float {
            $available = (int) $product->quantite_approvisionnee - (int) $product->quantite_sortie;

            return max(0, $available) * (float) $product->prix_unitaire;
        });

        $products->when($search !== '', function (Builder $query) use ($search) {
            $query->where(function (Builder $query) use ($search) {
                $query->where('reference', 'like', "%{$search}%")
                    ->orWhere('designation', 'like', "%{$search}%");
            });
        })->orderBy('designation');

        $perPage = min(max($request->integer('per_page', 10), 1), 100);
        $inventory = $products->paginate($perPage)->through(function (Produit $product): array {
            $supplied = (int) $product->quantite_approvisionnee;
            $sold = (int) $product->quantite_vendue;
            $available = $supplied - (int) $product->quantite_sortie;

            return [
                'id_produit' => $product->id_produit,
                'reference' => $product->reference,
                'designation' => $product->designation,
                'prix_unitaire' => (float) $product->prix_unitaire,
                'quantite_approvisionnee' => $supplied,
                'quantite_vendue' => $sold,
                'stock_disponible' => $available,
                'valeur_stock' => max(0, $available) * (float) $product->prix_unitaire,
                'statut' => $available <= 0 ? 'rupture' : ($available < 5 ? 'faible' : 'en_stock'),
            ];
        });

        return response()->json([
            ...$inventory->toArray(),
            'summary' => [
                'total_value' => $totalValue,
                'products_count' => $summaryProducts->count(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $search = trim((string) $request->query('search', ''));

        $query = StockMouvement::query()
            ->with('produit:id_produit,reference,designation')
            ->where('id_admin', $user->id_admin)
            ->where('type_mouvement', 'entree')
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->whereHas('produit', function (Builder $query) use ($search) {
                    $query->where('reference', 'like', "%{$search}%")
                        ->orWhere('designation', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('date_from'), fn (Builder $query) => $query
                ->whereDate('date_mouvement', '>=', $request->query('date_from')))
            ->when($request->filled('date_to'), fn (Builder $query) => $query
                ->whereDate('date_mouvement', '<=', $request->query('date_to')))
            ->orderByDesc('date_mouvement')
            ->orderByDesc('id_mouvement');

        $movements = $query->paginate(10);
        $productIds = $movements->getCollection()
            ->pluck('id_produit')
            ->unique()
            ->values()
            ->all();
        $usage = $this->lotUsage($user->id_admin, $productIds);

        $movements->getCollection()->transform(function (StockMouvement $movement) use ($usage) {
            $movement->quantite_vendue = $usage['sold'][$movement->id_mouvement] ?? 0;
            $movement->quantite_sortie = $usage['consumed'][$movement->id_mouvement] ?? 0;
            $movement->quantite_restante = (int) $movement->quantite
                - $movement->quantite_sortie;

            return $movement;
        });

        return response()->json($movements);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_produit' => 'required|integer',
            'type_mouvement' => 'required|in:entree,sortie',
            'quantite' => 'required|integer|min:1',
            'reference' => 'nullable|string|max:100',
            'commentaire' => 'nullable|string',
            'date_mouvement' => 'required|date',
        ]);
        $user = $request->user();

        $movement = DB::transaction(function () use ($validated, $user) {
            $product = Produit::query()
                ->where('id_admin', $user->id_admin)
                ->lockForUpdate()
                ->findOrFail($validated['id_produit']);

            if ($validated['type_mouvement'] === 'sortie') {
                $currentStock = (int) $product->mouvementsStock()
                    ->where('type_mouvement', 'entree')
                    ->sum('quantite')
                    - (int) $product->mouvementsStock()
                        ->where('type_mouvement', 'sortie')
                        ->sum('quantite');

                if ($currentStock < $validated['quantite']) {
                    abort(response()->json([
                        'message' => 'Stock insuffisant pour ce produit.',
                        'stock_actuel' => $currentStock,
                    ], 422));
                }
            }

            return StockMouvement::create([
                ...$validated,
                'id_admin' => $user->id_admin,
                'id_commercial' => $user->id_commercial ?? null,
            ]);
        });

        return response()->json([
            'message' => 'Approvisionnement enregistré avec succès.',
            'mouvement' => $movement->load('produit:id_produit,reference,designation'),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'quantite' => 'required|integer|min:1',
        ]);
        $user = $request->user();

        $movement = DB::transaction(function () use ($validated, $user, $id) {
            $movement = StockMouvement::query()
                ->where('id_admin', $user->id_admin)
                ->lockForUpdate()
                ->findOrFail($id);

            if ($movement->type_mouvement !== 'entree') {
                abort(response()->json([
                    'message' => 'Seuls les lots approvisionnés peuvent être modifiés ici.',
                ], 422));
            }

            Produit::query()
                ->where('id_admin', $user->id_admin)
                ->lockForUpdate()
                ->findOrFail($movement->id_produit);

            $usage = $this->lotUsage($user->id_admin, [$movement->id_produit]);
            $consumed = $usage['consumed'][$movement->id_mouvement] ?? 0;

            if ($validated['quantite'] < $consumed) {
                abort(response()->json([
                    'message' => "La quantité ne peut pas être inférieure aux {$consumed} unité(s) déjà sorties de ce lot.",
                    'quantite_minimale' => $consumed,
                ], 422));
            }

            $stockAfterUpdate = (int) StockMouvement::query()
                ->where('id_produit', $movement->id_produit)
                ->where('id_admin', $user->id_admin)
                ->where('type_mouvement', 'entree')
                ->sum('quantite')
                - (int) StockMouvement::query()
                    ->where('id_produit', $movement->id_produit)
                    ->where('id_admin', $user->id_admin)
                    ->where('type_mouvement', 'sortie')
                    ->sum('quantite')
                - (int) $movement->quantite
                + $validated['quantite'];

            if ($stockAfterUpdate < 0) {
                abort(response()->json([
                    'message' => 'La quantité ne peut pas être inférieure aux unités déjà sorties du stock.',
                ], 422));
            }

            $movement->update(['quantite' => $validated['quantite']]);

            return $movement->fresh()->load('produit:id_produit,reference,designation');
        });

        return response()->json([
            'message' => 'Quantité du lot mise à jour.',
            'mouvement' => $movement,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        DB::transaction(function () use ($user, $id) {
            $movement = StockMouvement::query()
                ->where('id_admin', $user->id_admin)
                ->lockForUpdate()
                ->findOrFail($id);

            if ($movement->type_mouvement !== 'entree') {
                abort(response()->json([
                    'message' => 'Seuls les lots approvisionnés peuvent être supprimés ici.',
                ], 422));
            }

            Produit::query()
                ->where('id_admin', $user->id_admin)
                ->lockForUpdate()
                ->findOrFail($movement->id_produit);

            $usage = $this->lotUsage($user->id_admin, [$movement->id_produit]);
            $consumed = $usage['consumed'][$movement->id_mouvement] ?? 0;

            if ($consumed > 0) {
                abort(response()->json([
                    'message' => 'Ce lot ne peut pas être supprimé car des unités en ont déjà été sorties.',
                    'quantite_sortie' => $consumed,
                ], 422));
            }

            $movement->delete();
        });

        return response()->json(['message' => 'Lot supprimé.']);
    }

    /**
     * Distributes stock exits over received lots in FIFO order.
     *
     * @return array{consumed: array<int, int>, sold: array<int, int>}
     */
    private function lotUsage(int $adminId, array $productIds): array
    {
        if ($productIds === []) {
            return ['consumed' => [], 'sold' => []];
        }

        $events = StockMouvement::query()
            ->where('id_admin', $adminId)
            ->whereIn('id_produit', $productIds)
            ->orderBy('date_mouvement')
            ->orderBy('id_mouvement')
            ->get();

        $lotsByProduct = [];
        $consumed = [];
        $sold = [];

        foreach ($events as $event) {
            if ($event->type_mouvement === 'entree') {
                $lotsByProduct[$event->id_produit][] = [
                    'id' => $event->id_mouvement,
                    'date' => $event->date_mouvement,
                    'remaining' => (int) $event->quantite,
                ];
                continue;
            }

            $quantityToAllocate = (int) $event->quantite;
            foreach ($lotsByProduct[$event->id_produit] ?? [] as &$lot) {
                if ($quantityToAllocate <= 0) {
                    break;
                }
                if ($lot['date'] > $event->date_mouvement || $lot['remaining'] <= 0) {
                    continue;
                }

                $allocated = min($quantityToAllocate, $lot['remaining']);
                $lot['remaining'] -= $allocated;
                $quantityToAllocate -= $allocated;
                $consumed[$lot['id']] = ($consumed[$lot['id']] ?? 0) + $allocated;

                if (str_starts_with((string) $event->reference, 'VENTE-')) {
                    $sold[$lot['id']] = ($sold[$lot['id']] ?? 0) + $allocated;
                }
            }
            unset($lot);
        }

        return ['consumed' => $consumed, 'sold' => $sold];
    }
}
