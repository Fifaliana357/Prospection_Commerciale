<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Commercial;
use App\Models\ComptabiliteOperation;
use App\Models\Vente;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ComptabiliteController extends Controller
{
    public function export(Request $request): StreamedResponse
    {
        $admin = $this->admin($request);
        $validated = $request->validate([
            'type' => 'required|in:recettes,depense,versement',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);
        $type = $validated['type'];

        return response()->streamDownload(function () use ($admin, $request, $type) {
            $output = fopen('php://output', 'w');
            if ($output === false) {
                throw new \RuntimeException('Impossible de créer le fichier d’export comptable.');
            }
            fwrite($output, "\xEF\xBB\xBF");

            if ($type === 'recettes') {
                fputcsv($output, ['Date', 'Numéro de vente', 'Client', 'Montant (MGA)'], ';');
                $this->salesQuery($admin, $request)
                    ->with('client:id_client,nom,prenom,entreprise')
                    ->orderBy('id_vente')
                    ->lazyById(500, 'id_vente')
                    ->each(function (Vente $sale) use ($output) {
                        fputcsv($output, [
                            ($sale->date_vente ?? $sale->created_at)?->format('Y-m-d H:i:s'),
                            $sale->numero,
                            $sale->client?->entreprise ?: trim(($sale->client?->prenom ?? '') . ' ' . ($sale->client?->nom ?? '')),
                            $sale->montant_ttc ?? $sale->montant_total,
                        ], ';');
                    });
            } else {
                fputcsv($output, ['Date et heure', 'Motif', 'Montant (MGA)', 'Pièce jointe'], ';');
                $this->operationsQuery($admin, $request, false)
                    ->where('type', $type)
                    ->orderBy('id_operation')
                    ->lazyById(500, 'id_operation')
                    ->each(function (ComptabiliteOperation $operation) use ($output) {
                        fputcsv($output, [
                            $operation->date_operation?->format('Y-m-d H:i:s'),
                            $operation->motif,
                            $operation->montant,
                            $operation->piece_jointe ? Storage::disk('public')->url($operation->piece_jointe) : '',
                        ], ';');
                    });
            }

            fclose($output);
        }, "comptabilite-{$type}-" . now()->format('Ymd-His') . '.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function index(Request $request)
    {
        $admin = $this->admin($request);
        $sales = $this->salesQuery($admin, $request);
        $operations = $this->operationsQuery($admin, $request);
        $summaryOperations = $this->operationsQuery($admin, $request, false);

        $revenueQuery = $this->salesQuery($admin, $request);
        $summary = [
            'recettes' => (float) $revenueQuery->sum(DB::raw('COALESCE(montant_ttc, montant_total)')),
            'ventes' => (clone $revenueQuery)->count(),
            'versements' => (float) (clone $summaryOperations)->where('type', 'versement')->sum('montant'),
            'nombre_versements' => (clone $summaryOperations)->where('type', 'versement')->count(),
            'depenses' => (float) (clone $summaryOperations)->where('type', 'depense')->sum('montant'),
            'nombre_depenses' => (clone $summaryOperations)->where('type', 'depense')->count(),
        ];
        $summary['solde'] = $summary['recettes'] + $summary['versements'] - $summary['depenses'];

        $salesPage = $sales->with(['client:id_client,nom,prenom,entreprise'])
            ->orderByDesc('date_vente')
            ->orderByDesc('id_vente')
            ->paginate(15, ['*'], 'sales_page');
        $operationsPage = $operations
            ->orderByDesc('date_operation')
            ->orderByDesc('id_operation')
            ->paginate(15, ['*'], 'operations_page');
        $operationsPage->getCollection()->transform(fn (ComptabiliteOperation $operation) => [
            ...$operation->toArray(),
            'piece_jointe_url' => $operation->piece_jointe
                ? Storage::disk('public')->url($operation->piece_jointe)
                : null,
        ]);

        return response()->json([
            'summary' => $summary,
            'sales' => $salesPage,
            'operations' => $operationsPage,
        ]);
    }

    public function store(Request $request)
    {
        $admin = $this->admin($request);
        $validated = $request->validate([
            'type' => 'required|in:depense,versement',
            'montant' => 'required|numeric|gt:0|max:9999999999999.99',
            'motif' => 'required|string|max:191',
            'date_operation' => 'required|date',
            'piece_jointe' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $attachmentPath = $request->file('piece_jointe')?->store('comptabilite', 'public');
        $operation = ComptabiliteOperation::create([
            ...collect($validated)->except('piece_jointe')->all(),
            'id_admin' => $admin->id_admin,
            'piece_jointe' => $attachmentPath,
        ]);

        return response()->json([
            'message' => 'Opération enregistrée.',
            'operation' => $operation,
        ], 201);
    }

    public function destroy(Request $request, int $id)
    {
        $operation = ComptabiliteOperation::query()
            ->where('id_admin', $this->admin($request)->id_admin)
            ->findOrFail($id);
        $path = $operation->piece_jointe;
        $operation->delete();

        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        return response()->json(['message' => 'Opération supprimée.']);
    }

    private function admin(Request $request): Admin
    {
        $user = $request->user();
        abort_unless($user instanceof Admin || $user instanceof Commercial, 403, 'Utilisateur non autorisé.');
        $admin = $user instanceof Admin ? $user : $user->admin;
        abort_if(! $admin, 404, 'Entreprise introuvable.');

        return $admin;
    }

    private function salesQuery(Admin $admin, Request $request): Builder
    {
        return Vente::query()
            ->where('id_admin', $admin->id_admin)
            ->where('statut', 'validee')
            ->when($request->filled('date_from'), fn (Builder $query) => $query
                ->whereDate(DB::raw('COALESCE(date_vente, created_at)'), '>=', $request->query('date_from')))
            ->when($request->filled('date_to'), fn (Builder $query) => $query
                ->whereDate(DB::raw('COALESCE(date_vente, created_at)'), '<=', $request->query('date_to')));
    }

    private function operationsQuery(Admin $admin, Request $request, bool $includeType = true): Builder
    {
        return ComptabiliteOperation::query()
            ->where('id_admin', $admin->id_admin)
            ->when($includeType && $request->filled('type'), fn (Builder $query) => $query
                ->where('type', $request->query('type')))
            ->when($request->filled('date_from'), fn (Builder $query) => $query
                ->whereDate('date_operation', '>=', $request->query('date_from')))
            ->when($request->filled('date_to'), fn (Builder $query) => $query
                ->whereDate('date_operation', '<=', $request->query('date_to')));
    }
}
