<?php

namespace App\Services\Softio;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SoftioClient
{
    /**
     * @return array<string, mixed>
     */
    public function echanger(string $code): array
    {
        try {
            $response = $this->post('/sso/echanger', ['code' => $code]);
        } catch (ConnectionException) {
            abort(503, 'Softio est injoignable pour le moment. Réessayez dans un instant.');
        }

        if ($response->status() === 403) {
            abort(403, "Votre abonnement au module Prospection n'est pas actif. Renouvelez-le depuis Softio.");
        }

        if ($response->status() === 401) {
            abort(503, 'La connexion avec Softio est mal configurée. Contactez l’administrateur.');
        }

        if ($response->serverError()) {
            Log::error('Erreur de Softio pendant la connexion au module Prospection.', [
                'status' => $response->status(),
            ]);

            abort(502, 'Softio a rencontré une erreur. Réessayez dans un instant.');
        }

        if (! $response->successful()) {
            abort(422, 'Ce lien de connexion est invalide ou a expiré. Rouvrez le module depuis Softio.');
        }

        $contentType = (string) $response->header('Content-Type');
        if (! preg_match('/(?:^|\/|\+)json(?:\s*;|$)/i', $contentType)) {
            Log::error('Softio a renvoyé un contenu non JSON pendant la connexion au module Prospection.', [
                'status' => $response->status(),
                'content_type' => $contentType,
            ]);

            abort(
                502,
                'Softio a renvoyé une page web au lieu de sa réponse API. Vérifiez que SOFTIO_API_URL pointe vers le serveur backend de Softio principal.',
            );
        }

        $payload = $response->json();
        if (! is_array($payload)) {
            abort(502, 'La réponse de Softio est invalide.');
        }

        return $payload;
    }

    public function accesActif(int $softioUserId): ?bool
    {
        try {
            $response = $this->post('/sso/verifier', [
                'user_id' => $softioUserId,
                'module_id' => config('softio.sso.module_id'),
            ]);
        } catch (ConnectionException) {
            Log::warning('Softio est injoignable pendant la vérification d’abonnement Prospection.');

            return null;
        }

        if (in_array($response->status(), [403, 404], true)) {
            return false;
        }

        if ($response->status() === 401) {
            abort(503, 'La connexion avec Softio est mal configurée. Contactez l’administrateur.');
        }

        if ($response->serverError()) {
            Log::warning('Softio a échoué pendant la vérification d’abonnement Prospection.', [
                'status' => $response->status(),
            ]);

            return null;
        }

        if (! $response->successful()) {
            abort(502, 'La réponse de vérification de Softio est invalide.');
        }

        $active = $response->json('acces.actif');
        if (! is_bool($active)) {
            abort(502, 'La réponse de vérification de Softio est invalide.');
        }

        return $active;
    }

    /**
     * @param  array<string, int|string>  $data
     */
    private function post(string $path, array $data): Response
    {
        $secret = (string) config('softio.sso.secret');
        $moduleId = config('softio.sso.module_id');

        if ($secret === '' || ! is_int($moduleId) || $moduleId < 1) {
            Log::error('Connexion Softio non configurée : SOFTIO_SSO_SECRET et SOFTIO_MODULE_ID sont obligatoires.');

            abort(503, 'La connexion depuis Softio n’est pas configurée.');
        }

        return Http::acceptJson()
            ->timeout(10)
            ->withHeaders(['X-Sso-Secret' => $secret])
            ->post(config('softio.sso.api_url').$path, $data);
    }
}
