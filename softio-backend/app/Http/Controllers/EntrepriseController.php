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

    public function image(Request $request, string $field)
    {
        abort_unless(in_array($field, ['logo', 'cachet', 'signature'], true), 404);

        $user = $request->user();
        $admin = $user instanceof Admin ? $user : $user->admin;
        abort_if(! $admin, 404, 'Entreprise introuvable.');

        $company = Entreprise::query()->where('id_admin', $admin->id_admin)->firstOrFail();
        $relativePath = $company->{$field};
        abort_unless($relativePath && Storage::disk('public')->exists($relativePath), 404, 'Image introuvable.');

        return response()->file(
            Storage::disk('public')->path($relativePath),
            ['Cache-Control' => 'private, max-age=300']
        );
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
