<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Schema; // <-- Ajoute cette ligne
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Schema::defaultStringLength(191); // <-- Ajoute cette ligne
        ResetPassword::createUrlUsing(function ($user, string $token): string {
            return rtrim(config('app.frontend_url'), '/').'/reset-password?token='
                .urlencode($token).'&email='.urlencode($user->getEmailForPasswordReset());
        });
    }
}
