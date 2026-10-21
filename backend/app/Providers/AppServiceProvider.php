<?php

namespace App\Providers;

use App\Auth\DoxaLinkHost;
use App\Auth\DoxaUserProvisioner;
use App\Auth\HrmDoxaUserProvisioner;
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
        $this->app->bind(DoxaUserProvisioner::class, HrmDoxaUserProvisioner::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
