<?php

namespace Tests\Feature;

use App\Services\Softio\SoftioClient;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SoftioClientTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'softio.sso.api_url' => 'https://softio.example.test/api',
            'softio.sso.secret' => 'test-secret',
            'softio.sso.module_id' => 42,
        ]);
    }

    public function test_it_exchanges_the_temporary_code_with_the_shared_secret(): void
    {
        Http::fake([
            'https://softio.example.test/api/sso/echanger' => Http::response([
                'utilisateur' => ['id' => 7],
                'organisation' => ['id' => 7],
                'module' => ['id' => 42],
                'acces' => ['actif' => true],
            ]),
        ]);

        $response = app(SoftioClient::class)->echanger('one-time-code');

        $this->assertSame(7, $response['utilisateur']['id']);
        Http::assertSent(fn (Request $request): bool => $request->url() === 'https://softio.example.test/api/sso/echanger'
            && $request->data() === ['code' => 'one-time-code']
            && $request->hasHeader('X-Sso-Secret', 'test-secret'));
    }

    public function test_it_reads_the_subscription_status_from_softio(): void
    {
        Http::fake([
            'https://softio.example.test/api/sso/verifier' => Http::response([
                'acces' => ['actif' => false],
            ]),
        ]);

        $this->assertFalse(app(SoftioClient::class)->accesActif(7));
        Http::assertSent(fn (Request $request): bool => $request->data() === [
            'user_id' => 7,
            'module_id' => 42,
        ]);
    }

    public function test_it_explains_when_the_configured_softio_url_returns_a_web_page(): void
    {
        Http::fake([
            'https://softio.example.test/api/sso/echanger' => Http::response(
                '<!doctype html><title>Softio</title>',
                200,
                ['Content-Type' => 'text/html; charset=UTF-8'],
            ),
        ]);

        $this->postJson('/api/sso', ['code' => 'one-time-code'])
            ->assertStatus(502)
            ->assertJsonPath(
                'message',
                'Softio a renvoyé une page web au lieu de sa réponse API. Vérifiez que SOFTIO_API_URL pointe vers le serveur backend de Softio principal.',
            );
    }
}
