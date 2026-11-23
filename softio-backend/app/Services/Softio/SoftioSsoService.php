<?php

namespace App\Services\Softio;

use App\Models\Admin;
use App\Models\Commercial;
use App\Models\Entreprise;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SoftioSsoService
{
    public function __construct(private readonly SoftioClient $softio) {}

    /**
     * @return array{user: Admin|Commercial, type: 'admin'|'commercial'}
     */
    public function connecter(string $code): array
    {
        $infos = $this->softio->echanger($code);
        $user = $infos['utilisateur'] ?? null;
        $organisation = $infos['organisation'] ?? null;

        if (! is_array($user) || ! is_array($organisation)) {
            abort(502, 'Les informations de compte reçues de Softio sont invalides.');
        }

        $userId = filter_var($user['id'] ?? null, FILTER_VALIDATE_INT);
        $organisationId = filter_var($organisation['id'] ?? null, FILTER_VALIDATE_INT);
        $moduleId = filter_var($infos['module']['id'] ?? null, FILTER_VALIDATE_INT);
        $expectedModuleId = config('softio.sso.module_id');
        $email = mb_strtolower(trim((string) ($user['email'] ?? '')));

        if (
            $userId === false || $userId < 1
            || $organisationId === false || $organisationId < 1
            || ! filter_var($email, FILTER_VALIDATE_EMAIL)
            || $moduleId === false
            || ! is_int($expectedModuleId)
        ) {
            abort(502, 'Les informations de compte reçues de Softio sont invalides.');
        }

        if ($moduleId !== $expectedModuleId) {
            abort(403, 'Ce lien de connexion ne concerne pas le module Prospection.');
        }

        $accessActive = $infos['acces']['actif'] ?? null;
        if (! is_bool($accessActive)) {
            abort(502, 'Les informations d’abonnement reçues de Softio sont invalides.');
        }

        if (! $accessActive) {
            abort(403, "Votre abonnement au module Prospection n'est pas actif. Renouvelez-le depuis Softio.");
        }

        $person = [
            'id' => $userId,
            'email' => $email,
            'nom' => trim((string) ($user['nom'] ?? '')),
            'prenom' => trim((string) ($user['prenom'] ?? '')),
            'telephone' => trim((string) ($user['telephone'] ?? '')),
        ];
        $organisationName = trim((string) ($organisation['nom'] ?? ''));
        if ($organisationName === '') {
            $organisationName = trim((string) ($organisation['email'] ?? '')) ?: "Organisation Softio {$organisationId}";
        }
        $organisationTelephone = trim((string) ($organisation['telephone'] ?? $person['telephone']));
        $organisationEmail = mb_strtolower(trim((string) ($organisation['email'] ?? '')));

        return DB::transaction(function () use (
            $person,
            $organisationId,
            $organisationName,
            $organisationTelephone,
            $organisationEmail,
        ): array {
            if ($person['id'] === $organisationId) {
                return [
                    'user' => $this->synchroniserAdmin(
                        $person,
                        $organisationId,
                        $organisationName,
                        $organisationTelephone,
                        $organisationEmail,
                    ),
                    'type' => 'admin',
                ];
            }

            return ['user' => $this->synchroniserCommercial($person, $organisationId, $organisationName), 'type' => 'commercial'];
        });
    }

    /**
     * @param  array{id: int, email: string, nom: string, prenom: string}  $person
     */
    private function synchroniserAdmin(
        array $person,
        int $organisationId,
        string $organisationName,
        string $organisationTelephone,
        string $organisationEmail,
    ): Admin {
        $adminParUtilisateur = Admin::query()
            ->where('softio_user_id', $person['id'])
            ->lockForUpdate()
            ->first();
        $admin = Admin::query()
            ->where('softio_organisation_id', $organisationId)
            ->lockForUpdate()
            ->first();
        $commercial = Commercial::query()->where('softio_user_id', $person['id'])->exists();

        if ($commercial || ($adminParUtilisateur && $admin && $adminParUtilisateur->isNot($admin))) {
            abort(409, 'Ce compte Softio est déjà associé à un autre compte de prospection.');
        }

        $admin ??= $adminParUtilisateur;

        if (
            $admin
            && $admin->softio_organisation_id !== null
            && (int) $admin->softio_organisation_id !== $organisationId
        ) {
            abort(409, 'Ce compte administrateur est déjà associé à une autre organisation Softio.');
        }

        if (
            $admin
            && $admin->softio_user_id !== null
            && (int) $admin->softio_user_id !== $person['id']
        ) {
            abort(409, 'Cette organisation Softio est déjà associée à un autre compte de prospection.');
        }

        $this->verifierEmailDisponible($person['email'], $admin);
        $admin ??= new Admin;
        $companyExists = Entreprise::query()
            ->where('id_admin', $admin->id_admin)
            ->exists();
        $premiereConnexionSoftio = $admin->softio_user_id === null
            || ! $companyExists
            || (bool) $admin->is_first_login;
        $password = $admin->exists && $admin->softio_user_id !== null
            ? $admin->password
            : Hash::make(Str::random(64));

        $admin->forceFill([
            'softio_user_id' => $person['id'],
            'softio_organisation_id' => $organisationId,
            'nom' => $person['nom'] !== '' ? $person['nom'] : $person['email'],
            'prenom' => $person['prenom'] !== '' ? $person['prenom'] : null,
            'email' => $person['email'],
            'entreprise' => $organisationName,
            'telephone' => $organisationTelephone !== '' ? $organisationTelephone : ($admin->telephone ?: null),
            'password' => $password,
            'est_verifie' => true,
            'email_verification_required' => false,
            'is_first_login' => $premiereConnexionSoftio,
        ]);
        $admin->save();

        $company = Entreprise::query()->firstOrNew(['id_admin' => $admin->id_admin]);
        $company->forceFill([
            'nom_entreprise' => $organisationName,
            'email' => $organisationEmail !== '' ? $organisationEmail : $person['email'],
            'telephone' => $organisationTelephone !== '' ? $organisationTelephone : $company->telephone,
        ]);
        $company->save();

        return $admin;
    }

    /**
     * @param  array{id: int, email: string, nom: string, prenom: string}  $person
     */
    private function synchroniserCommercial(array $person, int $organisationId, string $organisationName): Commercial
    {
        if (Admin::query()->where('softio_user_id', $person['id'])->exists()) {
            abort(409, 'Ce compte Softio est déjà associé à un compte administrateur de prospection.');
        }

        $admin = Admin::query()
            ->where('softio_organisation_id', $organisationId)
            ->lockForUpdate()
            ->first();

        if (! $admin) {
            $admin = $this->creerOrganisation($organisationId, $organisationName);
        }

        $commercial = Commercial::query()
            ->where('softio_user_id', $person['id'])
            ->lockForUpdate()
            ->first();
        $this->verifierEmailDisponible($person['email'], null, $commercial);

        if (! $commercial) {
            $commercial = new Commercial;
        } elseif ((int) $commercial->id_admin !== (int) $admin->id_admin) {
            $commercial->tokens()->delete();
        }

        $commercial->forceFill([
            'id_admin' => $admin->id_admin,
            'softio_user_id' => $person['id'],
            'nom' => $person['nom'] !== '' ? $person['nom'] : $person['email'],
            'prenom' => $person['prenom'] !== '' ? $person['prenom'] : null,
            'email' => $person['email'],
            'password' => $commercial->exists ? $commercial->password : Hash::make(Str::random(64)),
            'actif' => true,
        ]);
        $commercial->save();

        return $commercial;
    }

    private function creerOrganisation(int $organisationId, string $organisationName): Admin
    {
        $email = "softio-organisation-{$organisationId}@softio.invalid";
        $this->verifierEmailDisponible($email);

        $admin = new Admin;
        $admin->forceFill([
            'softio_organisation_id' => $organisationId,
            'nom' => $organisationName,
            'email' => $email,
            'entreprise' => $organisationName,
            'password' => Hash::make(Str::random(64)),
            'est_verifie' => true,
            'email_verification_required' => false,
            'is_first_login' => false,
        ]);
        $admin->save();

        return $admin;
    }

    private function verifierEmailDisponible(
        string $email,
        ?Admin $exceptAdmin = null,
        ?Commercial $exceptCommercial = null,
    ): void {
        $adminQuery = Admin::query()->where('email', $email);
        if ($exceptAdmin) {
            $adminQuery->where('id_admin', '<>', $exceptAdmin->id_admin);
        }

        $commercialQuery = Commercial::query()->where('email', $email);
        if ($exceptCommercial) {
            $commercialQuery->where('id_commercial', '<>', $exceptCommercial->id_commercial);
        }

        if ($adminQuery->exists() || $commercialQuery->exists()) {
            abort(409, 'Un compte de prospection utilise déjà cette adresse e-mail. Contactez l’administrateur.');
        }
    }
}
