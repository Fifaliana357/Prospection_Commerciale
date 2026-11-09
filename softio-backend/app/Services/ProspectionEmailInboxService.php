<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Notification;
use App\Models\Prospection;
use App\Models\Proposition;
use Illuminate\Support\Facades\DB;
use Webklex\PHPIMAP\Attribute;

class ProspectionEmailInboxService
{
    public function receive(
        string $uid,
        string $sender,
        ?string $subject,
        string $body,
        array $references,
        ?string $incomingMessageId,
    ): string {
        if (Proposition::where('mail_uid', $uid)->exists()) {
            return 'duplicate';
        }

        $prospection = $this->findByThread($sender, $references);
        if (!$prospection) {
            $prospection = $this->findSingleActiveProspection($sender);
        }

        if (!$prospection) {
            return 'unmatched';
        }

        $client = $prospection->client;
        if (!$client) {
            return 'unmatched';
        }

        DB::transaction(function () use ($uid, $subject, $body, $incomingMessageId, $prospection, $client): void {
            $proposition = Proposition::create([
                'id_prospection' => $prospection->id_prospection,
                'id_commercial' => $prospection->id_commercial,
                'id_admin' => $prospection->id_admin,
                'date_proposition' => now(),
                'objet' => $subject ? mb_substr($subject, 0, 255) : null,
                'type' => 'entrant',
                'message' => mb_strcut($body, 0, 60000, 'UTF-8'),
                'type_message' => 'Email',
                'lu' => true,
                'mail_uid' => $uid,
                'mail_message_id' => $incomingMessageId,
            ]);

            $clientName = $client->entreprise ?: trim(($client->prenom ?? '') . ' ' . $client->nom);
            Notification::create([
                'id_admin' => $prospection->id_admin,
                'id_commercial' => $prospection->id_commercial,
                'type' => 'message',
                'titre' => 'Nouveau message de ' . $clientName,
                'sous_titre' => $subject ?: 'Réponse par e-mail',
                'contenu' => $proposition->message,
                'id_prospection' => $prospection->id_prospection,
                'id_client' => $client->id_client,
                'nom_client' => $clientName,
                'lu' => false,
            ]);
        });

        return 'stored';
    }

    /**
     * @param array<int, string> $references
     */
    private function findByThread(string $sender, array $references): ?Prospection
    {
        if ($references === []) {
            return null;
        }

        $sentMessage = Proposition::query()
            ->where('type', 'sortant')
            ->whereIn('mail_message_id', $references)
            ->with('prospection.client')
            ->first();

        if (!$sentMessage?->prospection?->client) {
            return null;
        }

        return strcasecmp((string) $sentMessage->prospection->client->email, $sender) === 0
            ? $sentMessage->prospection
            : null;
    }

    private function findSingleActiveProspection(string $sender): ?Prospection
    {
        $clients = Client::query()
            ->whereRaw('LOWER(email) = ?', [mb_strtolower($sender)])
            ->pluck('id_client');

        if ($clients->isEmpty()) {
            return null;
        }

        $prospections = Prospection::query()
            ->whereIn('id_client', $clients)
            ->where('est_perdu', false)
            ->where('etat', '!=', 'cloture')
            ->with('client')
            ->limit(2)
            ->get();

        return $prospections->count() === 1 ? $prospections->first() : null;
    }

    /**
     * @return array<int, string>
     */
    public static function headerIds(Attribute $attribute): array
    {
        $values = array_map(
            static fn (mixed $value): string => is_scalar($value) || $value instanceof \Stringable
                ? (string) $value
                : '',
            $attribute->all(),
        );
        $header = implode(' ', $values);
        preg_match_all('/<([^<>]+)>/', $header, $bracketedMatches);
        $ids = $bracketedMatches[1] ?? [];
        if ($ids === []) {
            preg_match_all('/[^\s,<>]+@[^\s,<>]+/', $header, $plainMatches);
            $ids = $plainMatches[0] ?? [];
        }

        return array_values(array_unique(array_map(
            static fn (string $value): string => '<' . trim($value, "<> \t\n\r\0\x0B") . '>',
            $ids,
        )));
    }
}
