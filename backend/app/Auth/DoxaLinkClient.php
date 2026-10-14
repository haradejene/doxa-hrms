<?php

namespace App\Auth;

use Doxa\Laravel\Config\DoxaConfig;
use Doxa\Laravel\DoxaClient;
use Doxa\Laravel\Transaction\CacheTransactionStore;
use Doxa\Laravel\Contracts\Transport;
use Doxa\Laravel\Oidc\IdTokenValidator;
use Doxa\Laravel\Oidc\JwksProvider;
use Doxa\Laravel\Token\CodeExchange;

final class DoxaLinkClient
{
    public function client(): DoxaClient
    {
        // Separate registered callback; SDK still owns every protocol operation.
        $config = new DoxaConfig([...config('doxa'), 'redirect_uri' => config('hrm.doxa_link_redirect_uri')]);
        $store = new CacheTransactionStore(app('cache')->store(config('doxa.cache_store')), app('encrypter'), $config);

        return app()->makeWith(DoxaClient::class, [
            'config' => $config, 'transactions' => $store,
            'exchange' => new CodeExchange($config, app(Transport::class), $store),
            'validator' => new IdTokenValidator(app(JwksProvider::class), $store),
        ]);
    }
}
