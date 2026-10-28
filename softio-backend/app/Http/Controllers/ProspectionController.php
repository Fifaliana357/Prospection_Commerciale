<?php

namespace App\Http\Controllers;

use App\Models\Prospection;
use App\Models\Proposition;
use App\Models\Client;
use Illuminate\Http\Request;

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

        if ($user instanceof \App\Models\Admin) {
            $query->where('id_admin', $user->id_admin);
        } else {
            $query->where('id_commercial', $user->id_commercial);
        }

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

        $prospections = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($prospections);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'id_client'         => 'required|exists:client,id_client',
            'id_offre'          => 'nullable|exists:offre,id_offre',
            'produit_prospecte' => 'nullable|string|max:255',
            'objet'             => 'nullable|string|max:255',
            'message'           => 'nullable|string',
            'type_message'      => 'nullable|string|max:50',
        ]);

        $prospection = Prospection::create([
            'id_admin'          => $user instanceof \App\Models\Admin ? $user->id_admin : $user->id_admin,
            'id_commercial'     => $user instanceof \App\Models\Commercial ? $user->id_commercial : null,
            'id_client'         => $validated['id_client'],
            'id_offre'          => $validated['id_offre'] ?? null,
            'produit_prospecte' => $validated['produit_prospecte'] ?? null,
            'etat'              => 'en_cours',
            'est_perdu'         => false,
        ]);

        // Créer le premier message (proposition)
        if (!empty($validated['message']) || !empty($validated['objet'])) {
            Proposition::create([
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
        }

        return response()->json([
            'message' => 'Prospection créée avec succès',
            'prospection' => $prospection->load(['client', 'offre'])
        ], 201);
    }

    public function show(Request $request, $id)
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

        // Sécurité
        if ($user instanceof \App\Models\Admin) {
            if ($prospection->id_admin !== $user->id_admin) {
                return response()->json(['message' => 'Non autorisé'], 403);
            }
        } else {
            if ($prospection->id_commercial !== $user->id_commercial) {
                return response()->json(['message' => 'Non autorisé'], 403);
            }
        }

        return response()->json($prospection);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $prospection = Prospection::findOrFail($id);

        // Sécurité simple
        if ($user instanceof \App\Models\Admin && $prospection->id_admin !== $user->id_admin) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'etat'      => 'sometimes|string',
            'est_perdu' => 'sometimes|boolean',
            'note_actuelle' => 'nullable|integer|min:0|max:5',
        ]);

        $prospection->update($validated);

        return response()->json([
            'message' => 'Prospection mise à jour',
            'prospection' => $prospection
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $prospection = Prospection::findOrFail($id);
        $prospection->delete();

        return response()->json(['message' => 'Prospection supprimée']);
    }

    // Ajouter un message (proposition)
    public function addMessage(Request $request, $id)
    {
        $user = $request->user();
        $prospection = Prospection::findOrFail($id);

        $validated = $request->validate([
            'objet'        => 'nullable|string|max:255',
            'message'      => 'required|string',
            'type'         => 'required|in:sortant,entrant',
            'type_message' => 'nullable|string|max:50',
            'note'         => 'nullable|integer|min:0|max:5',
        ]);

        $proposition = Proposition::create([
            'id_prospection'   => $prospection->id_prospection,
            'id_commercial'    => $user instanceof \App\Models\Commercial ? $user->id_commercial : null,
            'id_admin'         => $user instanceof \App\Models\Admin ? $user->id_admin : $prospection->id_admin,
            'date_proposition' => now(),
            'objet'            => $validated['objet'] ?? null,
            'type'             => $validated['type'],
            'message'          => $validated['message'],
            'type_message'     => $validated['type_message'] ?? 'Email',
            'note'             => $validated['note'] ?? null,
            'lu'               => true,
        ]);

        return response()->json([
            'message' => 'Message ajouté',
            'proposition' => $proposition
        ], 201);
    }
}
