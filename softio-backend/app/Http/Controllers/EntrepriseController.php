<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Entreprise;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EntrepriseController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        $admin = $user instanceof Admin ? $user : $user->admin;
        abort_if(! $admin, 404, 'Entreprise introuvable.');
        $company = Entreprise::firstOrNew(
            ['id_admin' => $admin->id_admin],
            [
                'nom_entreprise' => $admin->entreprise ?? '',
                'email' => $admin->email,
                'telephone' => $admin->telephone,
            ]
        );

        return response()->json(['entreprise' => $this->serialize($company)]);
    }

    public function update(Request $request)
    {
        $admin = $this->admin($request);
        $validated = $request->validate([
            'nom_entreprise' => 'required|string|max:191',
            'adresse' => 'nullable|string|max:255',
            'telephone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:191',
            'nif' => 'nullable|string|max:100',
            'stat' => 'nullable|string|max:100',
            'rcs' => 'nullable|string|max:100',
            'logo' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'cachet' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'signature' => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
        ]);

        $company = Entreprise::firstOrNew(['id_admin' => $admin->id_admin]);
        $company->fill(collect($validated)->except(['logo', 'cachet', 'signature'])->all());

        foreach (['logo', 'cachet', 'signature'] as $imageField) {
            if (! $request->hasFile($imageField)) {
                continue;
            }

            if ($company->{$imageField} && Storage::disk('public')->exists($company->{$imageField})) {
                Storage::disk('public')->delete($company->{$imageField});
            }
            $company->{$imageField} = $request->file($imageField)->store('entreprise', 'public');
        }

        $company->save();
        $admin->update(['entreprise' => $company->nom_entreprise]);

        return response()->json([
            'message' => 'Informations de l’entreprise enregistrées.',
            'entreprise' => $this->serialize($company),
        ]);
    }

    private function admin(Request $request): Admin
    {
        abort_unless($request->user() instanceof Admin, 403, 'Accès réservé à l’administrateur.');

        return $request->user();
    }

    private function serialize(Entreprise $company): array
    {
        $data = $company->toArray();
        foreach (['logo', 'cachet', 'signature'] as $imageField) {
            $data[$imageField . '_url'] = $company->{$imageField}
                ? Storage::disk('public')->url($company->{$imageField})
                : null;
        }

        return $data;
    }
}
