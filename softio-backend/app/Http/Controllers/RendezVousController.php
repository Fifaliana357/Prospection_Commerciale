<?php

namespace App\Http\Controllers;

use App\Models\RendezVous;
use Illuminate\Http\Request;
use Carbon\Carbon;

class RendezVousController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = RendezVous::with([
            'client:id_client,nom,prenom,telephone,email',
            'commercial:id_commercial,nom,prenom'
        ]);

        if ($user instanceof \App\Models\Admin) {
            $query->where('id_admin', $user->id_admin);
        } else {
            $query->where('id_commercial', $user->id_commercial);
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

        $rdvs = $query->orderBy('date_rdv', 'desc')->paginate(15);

        return response()->json($rdvs);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'id_client'   => 'required|exists:client,id_client',
            'date_rdv'    => 'required|date',
            'lieu'        => 'nullable|string|max:191',
            'type_rdv'    => 'nullable|string|max:191',
            'lien_rdv'    => 'nullable|string|max:191',
            'commentaire' => 'nullable|string',
            'statut'      => 'nullable|string|max:50',
        ]);

        $rdv = RendezVous::create([
            'id_admin'      => $user instanceof \App\Models\Admin ? $user->id_admin : $user->id_admin,
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

        return response()->json([
            'message' => 'Rendez-vous créé',
            'rendez_vous' => $rdv->load('client')
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $rdv = RendezVous::findOrFail($id);

        $validated = $request->validate([
            'id_client'   => 'sometimes|exists:client,id_client',
            'date_rdv'    => 'sometimes|date',
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

    public function destroy($id)
    {
        $rdv = RendezVous::findOrFail($id);
        $rdv->delete();

        return response()->json(['message' => 'Rendez-vous supprimé']);
    }
}
