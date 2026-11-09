<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\RendezVous;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Validation\Rule;

class RendezVousController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'date_debut' => 'sometimes|date_format:Y-m-d',
            'date_fin' => 'sometimes|date_format:Y-m-d|after_or_equal:date_debut',
            'per_page' => 'sometimes|integer|min:1|max:100',
        ]);

        $query = RendezVous::with([
            'client:id_client,nom,prenom,telephone,email',
            'commercial:id_commercial,nom,prenom'
        ]);

        $query->where('id_admin', $user->id_admin);

        if (isset($validated['date_debut'])) {
            $query->whereDate('date_rdv', '>=', $validated['date_debut']);
        }
        if (isset($validated['date_fin'])) {
            $query->whereDate('date_rdv', '<=', $validated['date_fin']);
        }

        // Filtres de date
        if ($request->filled('filtre')) {
            $today = Carbon::today();
            switch ($request->filtre) {
                case 'aujourdhui':
                    $query->whereDate('date_rdv', $today);
                    break;
                case 'demain':
                    $query->whereDate('date_rdv', $today->copy()->addDay());
                    break;
                case 'semaine':
                    $query->whereBetween('date_rdv', [
                        $today->copy()->startOfWeek(),
                        $today->copy()->endOfWeek()
                    ]);
                    break;
                case 'mois':
                    $query->whereMonth('date_rdv', $today->month)
                          ->whereYear('date_rdv', $today->year);
                    break;
            }
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('lieu', 'like', "%{$search}%")
                  ->orWhere('commentaire', 'like', "%{$search}%")
                  ->orWhereHas('client', function ($q2) use ($search) {
                      $q2->where('nom', 'like', "%{$search}%")
                         ->orWhere('prenom', 'like', "%{$search}%");
                  });
            });
        }

        $rdvs = $query
            ->orderBy('date_rdv', isset($validated['date_debut']) ? 'asc' : 'desc')
            ->paginate($validated['per_page'] ?? 15);

        return response()->json($rdvs);
    }

    public function show(Request $request, int $id)
    {
        $user = $request->user();
        $query = RendezVous::with([
            'client:id_client,nom,prenom,telephone,email,entreprise',
            'commercial:id_commercial,nom,prenom',
        ])->where('id_admin', $user->id_admin);

        return response()->json([
            'rendez_vous' => $query->findOrFail($id),
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'id_client'   => ['required', Rule::exists('client', 'id_client')->where('id_admin', $user->id_admin)],
            'date_rdv'    => 'required|date|after_or_equal:today',
            'lieu'        => 'nullable|string|max:191',
            'type_rdv'    => 'nullable|string|max:191',
            'lien_rdv'    => 'nullable|string|max:191',
            'commentaire' => 'nullable|string',
            'statut'      => 'nullable|string|max:50',
        ]);

        $rdv = RendezVous::create([
            'id_admin'      => $user->id_admin,
            'id_commercial' => $user instanceof \App\Models\Commercial ? $user->id_commercial : null,
            'id_client'     => $validated['id_client'],
            'date_rdv'      => $validated['date_rdv'],
            'lieu'          => $validated['lieu'] ?? null,
            'type_rdv'      => $validated['type_rdv'] ?? 'Direct',
            'lien_rdv'      => $validated['lien_rdv'] ?? null,
            'commentaire'   => $validated['commentaire'] ?? null,
            'statut'        => $validated['statut'] ?? 'prevu',
            'numero_rdv'    => 'RDV-' . date('ymd') . '-' . rand(100, 999),
        ]);

        $rdv->load('client');
        $client = $rdv->client;
        $nomClient = $client->entreprise ?: trim($client->prenom . ' ' . $client->nom);

        Notification::create([
            'id_admin'      => $rdv->id_admin,
            'id_commercial' => $rdv->id_commercial,
            'type'          => 'rdv',
            'titre'         => 'Nouveau rendez-vous avec ' . $nomClient,
            'sous_titre'    => $rdv->date_rdv->format('d/m/Y \à H:i'),
            'contenu'       => $rdv->commentaire ?: $rdv->lieu,
            'id_client'     => $client->id_client,
            'nom_client'    => $nomClient,
            'id_rdv'        => $rdv->id_rendez_vous,
            'lu'            => false,
        ]);

        return response()->json([
            'message' => 'Rendez-vous créé',
            'rendez_vous' => $rdv
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $rdv = RendezVous::findOrFail($id);
        abort_unless($rdv->id_admin === $user->id_admin, 403, 'Non autorisé.');

        $validated = $request->validate([
            'id_client'   => ['sometimes', Rule::exists('client', 'id_client')->where('id_admin', $user->id_admin)],
            'date_rdv'    => [
                'sometimes',
                'date',
                function (string $attribute, mixed $value, \Closure $fail) use ($rdv) {
                    if (! is_string($value) || strtotime($value) === false) {
                        return;
                    }

                    $date = Carbon::parse($value)->toDateString();
                    $existingDate = Carbon::parse($rdv->date_rdv)->toDateString();
                    if ($date < Carbon::today()->toDateString() && $date !== $existingDate) {
                        $fail('La date du rendez-vous ne peut pas être antérieure à aujourd’hui.');
                    }
                },
            ],
            'lieu'        => 'nullable|string|max:191',
            'type_rdv'    => 'nullable|string|max:191',
            'lien_rdv'    => 'nullable|string|max:191',
            'commentaire' => 'nullable|string',
            'statut'      => 'nullable|string|max:50',
        ]);

        $rdv->update($validated);

        return response()->json([
            'message' => 'Rendez-vous modifié',
            'rendez_vous' => $rdv->load('client')
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $rdv = RendezVous::findOrFail($id);
        abort_unless($rdv->id_admin === $request->user()->id_admin, 403, 'Non autorisé.');
        $rdv->delete();

        return response()->json(['message' => 'Rendez-vous supprimé']);
    }
}
