<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'api/*',
    ];

    /**
     * Preserve cookieless API clients, but never exempt browser sessions.
     */
    protected function inExceptArray($request)
    {
        if ($request->is('api/*') && $request->hasSession()
            && ($request->hasCookie(config('session.cookie'))
                || $this->app['auth']->guard('web')->check())) {
            return false;
        }

        return parent::inExceptArray($request);
    }
}
