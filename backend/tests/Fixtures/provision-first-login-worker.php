<?php

use App\Auth\DoxaAccountResolver;
use Doxa\Laravel\Contracts\Transport;
use Doxa\Laravel\DoxaClient;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tests\Fixtures\OidcProviderTransport;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => $argv[1],
    'doxa.issuer' => OidcProviderTransport::ISSUER, 'doxa.client_id' => OidcProviderTransport::CLIENT,
    'doxa.redirect_uri' => OidcProviderTransport::CALLBACK, 'doxa.client_secret' => null,
    'doxa.scopes' => ['openid'], 'doxa.cache_store' => 'concurrent-provision',
    'cache.stores.concurrent-provision' => ['driver' => 'file', 'path' => $argv[2]],
    'session.driver' => 'array', 'session.secure' => true, 'session.http_only' => true, 'session.same_site' => 'lax',
    'hrm.doxa_account_policy' => 'provision', 'hrm.doxa_default_role' => 'applicant']);
DB::purge('sqlite');
DB::statement('PRAGMA busy_timeout = 5000');
$session = $app['session']->driver('array');
$session->start();
$request = Request::create(OidcProviderTransport::CALLBACK, 'GET');
$request->setLaravelSession($session);
$app->instance('request', $request);
$provider = new OidcProviderTransport;
$provider->claims = ['email_verified' => true, 'email' => $argv[4]];
$app->instance(Transport::class, $provider);
$client = $app->make(DoxaClient::class);
parse_str(parse_url($client->beginLogin()->getTargetUrl(), PHP_URL_QUERY), $provider->authorization);
$callback = Request::create(OidcProviderTransport::CALLBACK.'?'.http_build_query(['state' => $provider->authorization['state'], 'code' => 'PRIVATE-CODE']));
$callback->setLaravelSession($session);
while (microtime(true) < (float) $argv[3]) {
    usleep(1000);
}
try {
    $user = $client->resolveAccount($callback, $app->make(DoxaAccountResolver::class));
    if (! $user) {
        throw new RuntimeException;
    }
    echo $user->getAuthIdentifier();
} catch (Throwable $e) {
    fwrite(STDERR, get_class($e));
    exit(1);
}
