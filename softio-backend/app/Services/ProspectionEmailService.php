<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Proposition;
use Illuminate\Mail\Message;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

class ProspectionEmailService
{
    public function send(Proposition $proposition, Client $client): string
    {
        $sender = (string) config('mail.from.address');
        $domain = substr(strrchr($sender, '@') ?: '@softio.local', 1);
        $messageId = '<softio.' . $proposition->id_proposition . '.' . Str::uuid() . '@' . $domain . '>';

        try {
            Mail::send('emails.prospection', [
                'body' => $proposition->message,
                'recipientName' => trim(($client->prenom ?? '') . ' ' . $client->nom),
            ], function (Message $message) use ($client, $proposition, $messageId, $sender): void {
                $message
                    ->to($client->email)
                    ->subject($proposition->objet ?: 'Message de prospection')
                    ->replyTo($sender, (string) config('mail.from.name'));

                $headers = $message->getSymfonyMessage()->getHeaders();
                $headers->addIdHeader('Message-ID', trim($messageId, '<>'));
                $headers->addTextHeader('X-Softio-Prospection-ID', (string) $proposition->id_prospection);
            });
        } catch (Throwable $exception) {
            report($exception);
            throw new \RuntimeException(
                'L’e-mail n’a pas pu être envoyé. Vérifiez la configuration SMTP du serveur.',
                previous: $exception,
            );
        }

        $proposition->mail_message_id = $messageId;
        $proposition->save();

        return $messageId;
    }
}
