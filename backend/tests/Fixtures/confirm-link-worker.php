<?php

use App\Http\Controllers\DoxaLinkController;
use App\Models\User;
use Doxa\Laravel\Contracts\CredentialStore;
use Doxa\Laravel\Contracts\Transport;
use Doxa\Laravel\Credentials\DatabaseCredentialStore;
use Doxa\Laravel\Credentials\LaravelCredentialCipher;
use GuzzleHttp\Promise\Create;
use GuzzleHttp\Psr7\Response;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Tests\Fixtures\OidcProviderTransport;

// Independent-process managed-link harness. IAM HTTP is simulated; SDK storage/CAS is real.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => $argv[1],
    'database.connections.link-credentials' => ['driver' => 'sqlite', 'database' => $argv[5], 'prefix' => ''],
    'doxa.credentials.enabled' => true, 'doxa.credentials.connection' => 'link-credentials',
    'doxa.credentials.key' => str_repeat('k', 32), 'doxa.credentials.key_id' => 'test',
    'session.secure' => true, 'session.http_only' => true, 'session.same_site' => 'lax',
    'doxa.issuer' => OidcProviderTransport::ISSUER,
    'doxa.client_id' => OidcProviderTransport::CLIENT, 'doxa.client_secret' => null,
    'doxa.redirect_uri' => OidcProviderTransport::CALLBACK,
    'hrm.doxa_link_redirect_uri' => 'https://hrm.example.test/auth/doxa/link/callback',
    'doxa.cache_store' => 'link-test', 'cache.stores.link-test' => ['driver' => 'file', 'path' => $argv[7]]]);
DB::purge('sqlite');
DB::statement('PRAGMA busy_timeout = 5000');
DB::connection('link-credentials')->statement('PRAGMA busy_timeout = 5000');
Auth::guard('web')->setUser(User::findOrFail($argv[3]));
$session = $app['session']->driver('array');
$session->setId($argv[6]);
$session->start();
$request = Request::create('/auth/doxa/link/'.$argv[2].'/confirm', 'POST');
$request->setLaravelSession($session);
$app->instance('request', $request);
$app->instance(Transport::class, new OidcProviderTransport);
$app->bind(CredentialStore::class, fn () => new DatabaseCredentialStore(
    DB::connection('link-credentials'),
    new LaravelCredentialCipher(str_repeat('k', 32), 'test'), 'doxa_credential_contexts', 3600,
    fn () => Create::promiseFor(new Response(200, ['Content-Type' => 'application/json'], '{"effective":true}'))));
$controller = $app->make(DoxaLinkController::class);
while (microtime(true) < (float) $argv[4]) {
    usleep(1000);
}
$response = $controller->confirm($request, $argv[2]);
echo $response->getStatusCode();
