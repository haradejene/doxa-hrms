<?php

namespace App\Http\Controllers;

use App\Auth\DoxaAccountResolver;
use Doxa\Laravel\DoxaClient;
use Doxa\Laravel\Exceptions\ConfigurationException;
use Doxa\Laravel\Exceptions\DoxaException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Throwable;

final class DoxaLoginController extends Controller
{
    public function login()
    {
        try {
            // Resolve inside the safe boundary, including configuration failures.
            return app(DoxaClient::class)->beginLogin();
        } catch (DoxaException $exception) {
            // Laravel's routing pipeline renders thrown exceptions before outer
            // middleware can catch them. Return only the SDK's safe category.
            return response()->json(['error' => $exception->category], 400);
        } catch (Throwable) {
            return response()->json(['error' => 'authentication_unavailable'], 503);
        }
    }

    public function callback(#[\SensitiveParameter] Request $request, DoxaAccountResolver $users)
    {
        $stage = 'destination_configuration';
        try {
            // No session rotation or local authentication before SDK validation.
            $destination = $this->dashboardDestination();
            $stage = 'sdk_callback_and_account_resolution';
            $user = app(DoxaClient::class)->resolveAccount($request, $users);

            if ($user === null) {
                return response()->json(['error' => 'access_denied'], 403);
            }

            // SessionGuard::login destroys/migrates the old ID after validation.
            $stage = 'local_session';
            Auth::guard('web')->login($user, false);
            $request->session()->regenerateToken();
            Log::info('doxa.login.session_established', ['user_id' => $user->getAuthIdentifier()]);

            // Keep /dashboard relative to the public browser origin even when
            // a trusted proxy forwards to an internal backend host.
            return new RedirectResponse($destination);
        } catch (DoxaException $exception) {
            Log::notice('doxa.login.sdk_denied', ['stage' => $stage, 'category' => $exception->category,
                'exception_class' => get_class($exception)]);

            return response()->json(['error' => $exception->category], 400);
        } catch (Throwable $exception) {
            Log::error('doxa.login.failed', ['stage' => $stage, 'exception_class' => get_class($exception),
                'source' => basename($exception->getFile()), 'line' => $exception->getLine()]);

            // Never report raw callback/provider/SQL exceptions to the browser.
            return response()->json(['error' => 'authentication_unavailable'], 503);
        }
    }

    private function dashboardDestination(): string
    {
        $frontend = config('hrm.frontend_url');
        if ($frontend === null || $frontend === '') {
            return '/dashboard';
        }

        $parts = is_string($frontend) ? parse_url($frontend) : false;
        if ($parts === false || ! filter_var($frontend, FILTER_VALIDATE_URL)
            || ($parts['scheme'] ?? null) !== 'https' || empty($parts['host'])
            || isset($parts['user']) || isset($parts['pass'])
            || isset($parts['query']) || isset($parts['fragment'])
            || ! in_array($parts['path'] ?? '', ['', '/'], true)) {
            throw new ConfigurationException('configuration_error');
        }

        // Only server configuration supplies this origin. No return_to/intended URL.
        return rtrim($frontend, '/').'/dashboard';
    }
}
