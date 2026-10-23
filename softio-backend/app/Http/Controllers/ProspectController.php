<?php

namespace App\Http\Controllers;

use App\Models\Prospect;
use Illuminate\Http\Request;

class ProspectController extends Controller
{
    public function index(Request $request)
    {
        $query = Prospect::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('entreprise', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('matricule', 'like', "%{$search}%")
                  ->orWhere('contact', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type') && $request->input('type') !== 'Tous') {
            $query->where('type', strtolower($request->input('type')));
        }

        if ($request->filled('classification') && $request->input('classification') !== 'Tous') {
            $query->where('classification', $request->input('classification'));
        }

        return response()->json($query->orderBy('id', 'asc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'matricule'      => 'nullable|string|max:50|unique:prospects',
            'nom'            => 'nullable|string|max:100',
            'prenom'         => 'nullable|string|max:100',
            'type'           => 'required|in:particulier,entreprise',
            'email'          => 'nullable|string|max:150',
            'contact'        => 'nullable|string|max:50',
            'entreprise'     => 'nullable|string|max:150',
            'poste'          => 'nullable|string|max:100',
            'classification' => 'required|string|max:50',
            'pays'           => 'nullable|string|max:100',
            'domaine'        => 'nullable|string|max:100',
            'profession'     => 'nullable|string|max:100',
            'linkedin'       => 'nullable|string|max:191',
            'facebook'       => 'nullable|string|max:191',
            'siteweb'        => 'nullable|string|max:191',
            'interets'       => 'nullable|string',
        ]);

        if (empty($validated['matricule'])) {
            $lastProspect = Prospect::orderBy('id', 'desc')->first();
            $nextNum = 1;
            if ($lastProspect && preg_match('/(\d+)/', $lastProspect->matricule, $matches)) {
                $nextNum = ((int)$matches[1]) + 1;
            } else {
                $maxNum = 0;
                foreach (Prospect::pluck('matricule') as $m) {
                    if (preg_match('/(\d+)/', $m, $matches)) {
                        $maxNum = max($maxNum, (int)$matches[1]);
                    }
                }
                $nextNum = $maxNum + 1;
            }
            $validated['matricule'] = 'P-' . str_pad($nextNum, 4, '0', STR_PAD_LEFT);
        }

        if (empty($validated['pays'])) {
            $validated['pays'] = 'Madagascar';
        }

        $prospect = Prospect::create($validated);

        return response()->json($prospect, 201);
    }

    public function show(Prospect $prospect)
    {
        return response()->json($prospect);
    }

    public function update(Request $request, Prospect $prospect)
    {
        $validated = $request->validate([
            'matricule'      => 'nullable|string|max:50|unique:prospects,matricule,' . $prospect->id,
            'nom'            => 'nullable|string|max:100',
            'prenom'         => 'nullable|string|max:100',
            'type'           => 'sometimes|in:particulier,entreprise',
            'email'          => 'nullable|string|max:150',
            'contact'        => 'nullable|string|max:50',
            'entreprise'     => 'nullable|string|max:150',
            'poste'          => 'nullable|string|max:100',
            'classification' => 'sometimes|string|max:50',
            'pays'           => 'nullable|string|max:100',
            'domaine'        => 'nullable|string|max:100',
            'profession'     => 'nullable|string|max:100',
            'linkedin'       => 'nullable|string|max:191',
            'facebook'       => 'nullable|string|max:191',
            'siteweb'        => 'nullable|string|max:191',
            'interets'       => 'nullable|string',
        ]);

        $prospect->update($validated);

        return response()->json($prospect);
    }

    public function destroy(Prospect $prospect)
    {
        $prospect->delete();

        return response()->json([
            'message' => 'Prospect supprimé avec succès',
        ]);
    }
}
