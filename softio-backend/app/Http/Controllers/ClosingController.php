<?php

namespace App\Http\Controllers;

use App\Models\Closing;
use App\Models\Prospection;
use Illuminate\Http\Request;

class ClosingController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Closing::with([
            'client:id_client,nom,prenom,email,entreprise',
            'commercial:id_commercial,nom,prenom',
            'admin:id_admin,nom,prenom'
        ]);

        if ($user instanceof \App\Models\Admin) {
            $query->where('id_admin', $user->id_admin);
        } else {
            $query->where('id_commercial', $user->id_commercial);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('produit', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('client', function ($q2) use ($search) {
                      $q2->where('nom', 'like', "%{$search}%")
                         ->orWhere('prenom', 'like', "%{$search}%")
                         ->orWhere('entreprise', 'like', "%{$search}%");
                  });
            });
        }

        $closings = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json($closings);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'id_prospection' => 'nullable|exists:prospection,id_prospection',
            'id_client'      => 'required|exists:client,id_client',
            'produit'        => 'required|string|max:191',
            'description'    => 'nullable|string',
            'montant'        => 'required|numeric|min:0',
        ]);

        $closing = Closing::create([
            'id_prospection' => $validated['id_prospection'] ?? null,
            'id_client'      => $validated['id_client'],
            'id_admin'       => $user instanceof \App\Models\Admin ? $user->id_admin : null,
            'id_commercial'  => $user instanceof \App\Models\Commercial ? $user->id_commercial : null,
            'produit'        => $validated['produit'],
            'description'    => $validated['description'] ?? null,
            'montant'        => $validated['montant'],
        ]);

        // Clôturer la prospection si liée
        if (!empty($validated['id_prospection'])) {
            Prospection::where('id_prospection', $validated['id_prospection'])
                ->update(['etat' => 'cloture', 'est_perdu' => false]);
        }

        return response()->json([
            'message' => 'Closing enregistré',
            'closing' => $closing->load('client')
        ], 201);
    }

    public function destroy($id)
    {
        $closing = Closing::findOrFail($id);
        $closing->delete();

        return response()->json(['message' => 'Closing supprimé']);
    }
}
