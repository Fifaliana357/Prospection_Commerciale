<?php

namespace App\Http\Middleware;

use App\Services\Softio\SoftioClient;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class EnsureSoftioAccess
{
    public function __construct(private readonly SoftioClient $softio) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $softioUserId = $user?->softio_user_id;

        if ($softioUserId === null) {
            return $next($request);
        }

        $moduleId = (int) config('softio.sso.module_id');
        $cacheKey = "softio-prospection-access:{$moduleId}:{$softioUserId}";
        $active = Cache::get($cacheKey);

        if ($active === null) {
            $active = $this->softio->accesActif((int) $softioUserId);
            if ($active === null) {
                return $next($request);
            }

            Cache::put(
                $cacheKey,
                $active,
                now()->addMinutes(max(1, (int) config('softio.sso.verify_minutes'))),
            );
        }

        if (! $active) {
            $token = $user->currentAccessToken();
            if ($token instanceof PersonalAccessToken) {
                $token->delete();
            }

            return response()->json([
                'message' => "Votre abonnement au module Prospection n'est plus actif. Renouvelez-le depuis Softio.",
                'code' => 'softio_access_inactive',
            ], 403);
        }

        return $next($request);
    }
}
