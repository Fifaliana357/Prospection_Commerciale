<?php

namespace App\Http\Controllers;

use App\Models\Prospection;
use App\Models\Proposition;
use App\Models\Client;
use App\Models\Notification;
use App\Services\ProspectionEmailService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Throwable;

class ProspectionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Prospection::with([
            'client:id_client,nom,prenom,telephone,email,entreprise',
            'commercial:id_commercial,nom,prenom',
            'offre:id_offre,denomination'
        ]);

        $query->where('id_admin', $user->id_admin);

        // Filtres
        if ($request->filled('etat')) {
            if ($request->etat === 'perdu') {
                $query->where('est_perdu', true);
            } elseif ($request->etat === 'cloture') {
                $query->where('etat', 'cloture')->where('est_perdu', false);
            } elseif ($request->etat === 'non_cloture') {
                $query->where('etat', '!=', 'cloture')->where('est_perdu', false);
            }
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('produit_prospecte', 'like', "%{$search}%")
                  ->orWhereHas('client', function ($q2) use ($search) {
                      $q2->where('nom', 'like', "%{$search}%")
                         ->orWhere('prenom', 'like', "%{$search}%")
                         ->orWhere('telephone', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->boolean('relance_only')) {
            $query->whereNotNull('date_relance');
        }

        $prospections = $request->boolean('relance_only')
            ? $query->orderBy('date_relance')->paginate(15)
            : $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($prospections);
    }

    public function store(Request $request, ProspectionEmailService $emailService)
    {
        $user = $request->user();

        $validated = $request->validate([
            'id_client'         => ['required', Rule::exists('client', 'id_client')->where('id_admin', $user->id_admin)],
            'id_offre'          => ['nullable', Rule::exists('offre', 'id_offre')->where('id_admin', $user->id_admin)],
            'produit_prospecte' => 'nullable|string|max:255',
            'objet'             => 'nullable|string|max:255',
            'message'           => 'nullable|string',
            'type_message'      => 'nullable|string|max:50',
        ]);
        $client = Client::findOrFail($validated['id_client']);
        $isEmail = strtolower($validated['type_message'] ?? '') === 'email' && !empty($validated['message']);
        if ($isEmail && !filter_var((string) $client->email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['message' => 'Ce prospect ne possède pas d’adresse e-mail valide.'], 422);
        }

        try {
            $prospection = DB::transaction(function () use ($validated, $user, $client, $isEmail, $emailService) {
                $prospection = Prospection::create([
                    'id_admin'          => $user->id_admin,
                    'id_commercial'     => $user instanceof \App\Models\Commercial ? $user->id_commercial : null,
                    'id_client'         => $validated['id_client'],
                    'id_offre'          => $validated['id_offre'] ?? null,
                    'produit_prospecte' => $validated['produit_prospecte'] ?? null,
                    'etat'              => 'en_cours',
                    'est_perdu'         => false,
                ]);

                if (!empty($validated['message']) || (!empty($validated['objet']) && !$isEmail)) {
                    $proposition = Proposition::create([
                        'id_prospection'   => $prospection->id_prospection,
                        'id_commercial'    => $prospection->id_commercial,
                        'id_admin'         => $prospection->id_admin,
                        'date_proposition' => now(),
                        'objet'            => $validated['objet'] ?? 'Premier contact',
                        'type'             => 'sortant',
                        'message'          => $validated['message'] ?? '',
                        'type_message'     => $validated['type_message'] ?? 'Email',
                        'lu'               => true,
                    ]);

                    if ($isEmail) {
                        $emailService->send($proposition, $client);
                    }
                }

                return $prospection;
            });
        } catch (Throwable $exception) {
            report($exception);
            return response()->json([
                'message' => 'La prospection n’a pas pu être enregistrée ou son e-mail initial n’a pas pu être envoyé.',
            ], 502);
        }

        return response()->json([
            'message' => $isEmail ? 'Prospection créée et e-mail envoyé.' : 'Prospection créée avec succès',
            'prospection' => $prospection->load(['client', 'offre'])
        ], 201);
    }

    public function show(Request $request, int $id)
    {
        $user = $request->user();

        $prospection = Prospection::with([
            'client',
            'commercial:id_commercial,nom,prenom',
            'offre',
            'propositions' => function ($q) {
                $q->orderBy('date_proposition', 'asc');
            }
        ])->findOrFail($id);

        if ($prospection->id_admin !== $user->id_admin) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        return response()->json($prospection);
    }

    public function update(Request $request, int $id)
    {
        $user = $request->user();
        $prospection = Prospection::findOrFail($id);

        if ($prospection->id_admin !== $user->id_admin) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'etat'      => 'sometimes|string',
            'est_perdu' => 'sometimes|boolean',
            'note_actuelle' => 'nullable|integer|min:0|max:4',
            'date_relance' => 'nullable|date',
        ]);

        $prospection->update($validated);

        return response()->json([
            'message' => 'Prospection mise à jour',
            'prospection' => $prospection
        ]);
    }

    public function destroy(Request $request, int $id)
    {
        $user = $request->user();
        $prospection = Prospection::findOrFail($id);
        if ($prospection->id_admin !== $user->id_admin) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        $prospection->delete();

        return response()->json(['message' => 'Prospection supprimée']);
    }

    // Ajouter un message (proposition)
    public function addMessage(Request $request, int $id, ProspectionEmailService $emailService)
    {
        $user = $request->user();
        $prospection = Prospection::findOrFail($id);
        if ($prospection->id_admin !== $user->id_admin) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'objet'        => 'nullable|string|max:255',
            'message'      => 'required|string',
            'type'         => 'required|in:sortant,entrant',
            'type_message' => 'nullable|string|max:50',
            'note'         => 'nullable|integer|min:0|max:5',
        ]);

        $isEmail = $validated['type'] === 'sortant'
            && strtolower($validated['type_message'] ?? 'Email') === 'email';
        $client = $prospection->client;
        if ($isEmail && !filter_var((string) $client?->email, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['message' => 'Ce prospect ne possède pas d’adresse e-mail valide.'], 422);
        }
        if ($isEmail && trim((string) $validated['objet']) === '') {
            return response()->json(['message' => 'L’objet de l’e-mail est obligatoire.'], 422);
        }

        try {
            $proposition = DB::transaction(function () use ($prospection, $user, $validated, $isEmail, $client, $emailService) {
                $proposition = Proposition::create([
                    'id_prospection'   => $prospection->id_prospection,
                    'id_commercial'    => $user instanceof \App\Models\Commercial ? $user->id_commercial : null,
                    'id_admin'         => $prospection->id_admin,
                    'date_proposition' => now(),
                    'objet'            => $validated['objet'] ?? null,
                    'type'             => $validated['type'],
                    'message'          => $validated['message'],
                    'type_message'     => $validated['type_message'] ?? 'Email',
                    'note'             => $validated['note'] ?? null,
                    'lu'               => true,
                ]);

                if ($isEmail) {
                    $emailService->send($proposition, $client);
                }

                return $proposition;
            });
        } catch (Throwable $exception) {
            report($exception);
            return response()->json([
                'message' => $isEmail
                    ? 'L’e-mail n’a pas pu être envoyé; il n’a pas été ajouté à l’historique.'
                    : 'Le message n’a pas pu être enregistré.',
            ], 502);
        }

        if ($validated['type'] === 'entrant') {
            $client = $prospection->client;
            $nomClient = $client->entreprise ?: trim($client->prenom . ' ' . $client->nom);

            Notification::create([
                'id_admin'       => $prospection->id_admin,
                'id_commercial'  => $prospection->id_commercial,
                'type'           => 'message',
                'titre'          => 'Nouveau message de ' . $nomClient,
                'sous_titre'     => $validated['objet'] ?? 'Réponse',
                'contenu'        => $validated['message'],
                'id_prospection' => $prospection->id_prospection,
                'id_client'      => $client->id_client,
                'nom_client'     => $nomClient,
                'lu'             => false,
            ]);
        }

        return response()->json([
            'message' => $isEmail ? 'E-mail envoyé et ajouté à l’historique.' : 'Message ajouté',
            'proposition' => $proposition
        ], 201);
    }
}
