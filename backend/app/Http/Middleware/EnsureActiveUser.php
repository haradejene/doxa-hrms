<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureActiveUser
{
    public function handle(Request $request, Closure $next)
    {
        if (! $request->user()?->is_active || $request->user()->deleted_at !== null) {
            return response()->json(['message' => 'Account unavailable'], 401);
        }

        return $next($request);
    }
}
