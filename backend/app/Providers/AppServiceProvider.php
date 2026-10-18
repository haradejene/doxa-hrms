<?php

namespace App\Providers;

use App\Auth\DoxaLinkHost;
use Doxa\Laravel\Contracts\CredentialHostBinding;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(CredentialHostBinding::class, DoxaLinkHost::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
