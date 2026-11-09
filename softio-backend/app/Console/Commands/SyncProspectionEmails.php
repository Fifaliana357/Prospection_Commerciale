<?php

namespace App\Console\Commands;

use App\Services\ProspectionEmailInboxService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Webklex\PHPIMAP\Client;
use Webklex\PHPIMAP\ClientManager;

class SyncProspectionEmails extends Command
{
    protected $signature = 'prospections:sync-emails';

    protected $description = 'Importe les réponses e-mail liées aux prospections';

    public function handle(ProspectionEmailInboxService $inbox): int
    {
        $config = config('prospection_mail.imap');
        if (!$config['enabled']) {
            $this->info('La synchronisation IMAP est désactivée.');
            return self::SUCCESS;
        }

        if (empty($config['username']) || empty($config['password'])) {
            $this->error('Les identifiants IMAP de prospection ne sont pas configurés.');
            return self::FAILURE;
        }

        $client = null;
        try {
            $manager = new ClientManager();
            $client = $manager->make([
                'host' => $config['host'],
                'port' => $config['port'],
                'protocol' => 'imap',
                'encryption' => $config['encryption'],
                'validate_cert' => $config['validate_cert'],
                'username' => $config['username'],
                'password' => $config['password'],
                'authentication' => null,
                'timeout' => 15,
            ]);
            $client->connect();

            $folder = $client->getFolder($config['folder']);
            if (!$folder) {
                $this->error('Le dossier IMAP configuré est introuvable.');
                return self::FAILURE;
            }

            $mailbox = $config['folder'];
            $status = $folder->status();
            $uidValidity = (int) ($status['uidvalidity'] ?? 0);
            $state = DB::table('prospection_email_sync_state')->where('mailbox', $mailbox)->first();
            if (!$state || (int) $state->uid_validity !== $uidValidity) {
                DB::table('prospection_email_sync_state')->updateOrInsert(
                    ['mailbox' => $mailbox],
                    [
                        'last_uid' => max(0, (int) ($status['uidnext'] ?? 1) - 1),
                        'uid_validity' => $uidValidity,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                );
                $this->info('Boîte initialisée; seuls les nouveaux e-mails seront synchronisés.');
                return self::SUCCESS;
            }

            $lastUid = (int) $state->last_uid;
            $messages = iterator_to_array(
                $folder->messages()->whereUid(($lastUid + 1) . ':*')->get(),
            );
            usort($messages, static fn ($left, $right): int => $left->getUid() <=> $right->getUid());

            $stored = 0;
            $unmatched = 0;
            foreach ($messages as $message) {
                $uid = $config['folder'] . ':' . $message->getUid();
                $from = $message->getFrom()->first();
                $sender = is_object($from) && isset($from->mail) ? trim($from->mail) : '';
                if (!filter_var($sender, FILTER_VALIDATE_EMAIL)) {
                    $message->setFlag('Flagged');
                    $unmatched++;
                    $lastUid = $this->advanceCursor($mailbox, $lastUid, (int) $message->getUid(), $uidValidity);
                    continue;
                }

                $body = $message->getTextBody();
                if ($body === '' && $message->hasHTMLBody()) {
                    $body = html_entity_decode(strip_tags($message->getHTMLBody()), ENT_QUOTES | ENT_HTML5, 'UTF-8');
                }
                if (trim($body) === '') {
                    $message->setFlag('Flagged');
                    $unmatched++;
                    $lastUid = $this->advanceCursor($mailbox, $lastUid, (int) $message->getUid(), $uidValidity);
                    continue;
                }

                $references = array_values(array_unique(array_merge(
                    ProspectionEmailInboxService::headerIds($message->getInReplyTo()),
                    ProspectionEmailInboxService::headerIds($message->getReferences()),
                )));
                $messageId = ProspectionEmailInboxService::headerIds($message->getMessageId())[0] ?? null;
                $result = $inbox->receive(
                    $uid,
                    $sender,
                    $message->getSubject()->first() ?: null,
                    $body,
                    $references,
                    $messageId,
                );

                if ($result === 'unmatched') {
                    $message->setFlag('Flagged');
                    $unmatched++;
                    $lastUid = $this->advanceCursor($mailbox, $lastUid, (int) $message->getUid(), $uidValidity);
                    continue;
                }

                $message->setFlag('Seen');
                $lastUid = $this->advanceCursor($mailbox, $lastUid, (int) $message->getUid(), $uidValidity);
                if ($result === 'stored') {
                    $stored++;
                }
            }

            $this->info("{$stored} réponse(s) importée(s); {$unmatched} e-mail(s) sans prospection unique ont été marqués pour vérification.");
            return self::SUCCESS;
        } finally {
            if ($client instanceof Client) {
                $client->disconnect();
            }
        }
    }

    private function advanceCursor(string $mailbox, int $lastUid, int $messageUid, int $uidValidity): int
    {
        $nextUid = max($lastUid, $messageUid);
        DB::table('prospection_email_sync_state')
            ->where('mailbox', $mailbox)
            ->update([
                'last_uid' => $nextUid,
                'uid_validity' => $uidValidity,
                'updated_at' => now(),
            ]);

        return $nextUid;
    }
}
