<?php

namespace Tests\Unit;

use App\Services\ProspectionEmailInboxService;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;
use Webklex\PHPIMAP\Attribute;

class ProspectionEmailInboxServiceTest extends TestCase
{
    public function test_extracts_message_ids_from_reply_headers(): void
    {
        $header = new Attribute('references');
        $header->set('first@example.test');
        $header->set('second@example.test', 1);

        $this->assertSame(
            ['<first@example.test>', '<second@example.test>'],
            ProspectionEmailInboxService::headerIds($header),
        );
    }

    public function test_prospection_email_template_escapes_message_content(): void
    {
        $html = view('emails.prospection', [
            'recipientName' => 'Client Test',
            'body' => '<script>alert(1)</script>',
        ])->render();

        $this->assertStringContainsString('&lt;script&gt;alert(1)&lt;/script&gt;', $html);
        $this->assertStringNotContainsString('<script>alert(1)</script>', $html);
    }

    public function test_inbox_sync_is_inactive_until_enabled(): void
    {
        Config::set('prospection_mail.imap.enabled', false);

        $this->artisan('prospections:sync-emails')
            ->expectsOutput('La synchronisation IMAP est désactivée.')
            ->assertExitCode(0);
    }
}
