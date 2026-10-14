<?php

// File-backed SQLite concurrency harness. No real IAM/network or credentials.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => $argv[1]]);
\Illuminate\Support\Facades\DB::purge('sqlite');
\Illuminate\Support\Facades\DB::statement('PRAGMA busy_timeout = 5000');
config(['doxa.issuer' => \App\Models\DoxaLinkTransaction::findOrFail($argv[2])->identity['issuer']]);
\Illuminate\Support\Facades\Auth::guard('web')->setUser(\App\Models\User::findOrFail($argv[3]));
$session = $app['session']->driver('array');
$session->setId(str_repeat('a', 40));
$session->start();
$request = \Illuminate\Http\Request::create('/auth/doxa/link/'.$argv[2].'/confirm', 'POST');
$request->setLaravelSession($session);
$access = new class extends \App\Auth\DoxaApplicationAccess {
    public function allowed(string $issuer, string $subject): bool { return true; }
};
$controller = new \App\Http\Controllers\DoxaLinkController(new \App\Auth\DoxaLinkClient, $access, new \App\Auth\DoxaLinkAudit);
while (microtime(true) < (float) $argv[4]) usleep(1000);
$response = $controller->confirm($request, $argv[2]);
echo $response->getStatusCode();
if ($response->getStatusCode() !== 200) fwrite(STDERR, $response->getContent());
