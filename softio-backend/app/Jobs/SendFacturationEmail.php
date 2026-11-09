<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendFacturationEmail implements ShouldQueue
{
    use Dispatchable, Queueable;

    public function __construct(
        public string $email,
        public string $subject,
        public string $body,
        public string $pdfBytes,
        public string $attachmentName,
    ) {}

    public function handle(): void
    {
        try {
            Mail::send([], [], function ($message) {
                $message->to($this->email)
                    ->subject($this->subject)
                    ->html($this->body)
                    ->attachData($this->pdfBytes, $this->attachmentName, ['mime' => 'application/pdf']);
            });
        } catch (Throwable $exception) {
            report($exception);
            throw $exception;
        }
    }
}
