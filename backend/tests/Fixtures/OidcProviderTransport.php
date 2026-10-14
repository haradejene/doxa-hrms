<?php

namespace Tests\Fixtures;

use Closure;
use Doxa\Laravel\Contracts\Transport;
use Doxa\Laravel\Http\JsonResponse;
use Firebase\JWT\JWT;
use RuntimeException;

/** Only the provider network is simulated; all SDK services remain real. */
final class OidcProviderTransport implements Transport
{
    public const ISSUER = 'https://iam.example.test';

    public const CLIENT = 'hrm-test-client';

    public const CALLBACK = 'https://hrm.example.test/auth/doxa/callback';

    public array $authorization = [];
    public string $callback = self::CALLBACK;

    public array $claims = [];

    public int $exchanges = 0;

    public int $userinfoCalls = 0;

    public bool $rejectPkce = false;

    public bool $badSignature = false;

    public bool $discoveryFailure = false;

    public ?Closure $onExchange = null;

    public string $idToken = '';

    private string $privateKey;

    private array $jwk;

    public function __construct()
    {
        $options = ['private_key_type' => OPENSSL_KEYTYPE_RSA, 'private_key_bits' => 2048,
            'config' => __DIR__.'/oidc-openssl.cnf'];
        $key = openssl_pkey_new($options);
        openssl_pkey_export($key, $pem, null, $options);
        $this->privateKey = $pem;
        $rsa = openssl_pkey_get_details($key)['rsa'];
        $encode = fn ($value) => rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
        $this->jwk = ['kty' => 'RSA', 'use' => 'sig', 'alg' => 'RS256', 'kid' => 'test-key',
            'n' => $encode($rsa['n']), 'e' => $encode($rsa['e'])];
    }

    public function request(string $method, string $url, array $options = []): JsonResponse
    {
        if ($method === 'GET' && $url === self::ISSUER.'/.well-known/openid-configuration') {
            if ($this->discoveryFailure) {
                throw new RuntimeException('PRIVATE provider response');
            }

            return new JsonResponse([
                'issuer' => self::ISSUER,
                'authorization_endpoint' => self::ISSUER.'/oauth/authorize',
                'token_endpoint' => self::ISSUER.'/oauth/token',
                'jwks_uri' => self::ISSUER.'/oauth/jwks',
                'userinfo_endpoint' => self::ISSUER.'/oauth/userinfo',
                'response_types_supported' => ['code'], 'response_modes_supported' => ['query'],
                'grant_types_supported' => ['authorization_code'], 'subject_types_supported' => ['public'],
                'code_challenge_methods_supported' => ['S256'], 'id_token_signing_alg_values_supported' => ['RS256'],
                'scopes_supported' => ['openid'], 'token_endpoint_auth_methods_supported' => ['none', 'client_secret_basic'],
            ]);
        }
        if ($method === 'GET' && $url === self::ISSUER.'/oauth/jwks') {
            return new JsonResponse(['keys' => [$this->jwk]]);
        }
        if ($url === self::ISSUER.'/oauth/userinfo') {
            $this->userinfoCalls++;
            throw new RuntimeException('UserInfo must remain disabled');
        }
        if ($method !== 'POST' || $url !== self::ISSUER.'/oauth/token') {
            throw new RuntimeException('Unexpected provider endpoint');
        }

        $this->exchanges++;
        if ($this->onExchange !== null) {
            ($this->onExchange)();
        }
        $form = $options['form_params'];
        $challenge = rtrim(strtr(base64_encode(hash('sha256', $form['code_verifier'], true)), '+/', '-_'), '=');
        if ($this->rejectPkce || $challenge !== $this->authorization['code_challenge']
            || $form['client_id'] !== self::CLIENT || $form['redirect_uri'] !== $this->callback
            || $form['grant_type'] !== 'authorization_code' || $form['code'] !== 'PRIVATE-CODE') {
            throw new RuntimeException('PRIVATE code/PKCE exchange failure');
        }

        $claims = [...[
            'iss' => self::ISSUER, 'sub' => 'public-subject', 'aud' => self::CLIENT,
            'iat' => time(), 'exp' => time() + 300, 'nonce' => $this->authorization['nonce'],
            'email' => 'local@example.test', 'name' => 'IAM name must not sync', 'roles' => ['hr_admin'],
        ], ...$this->claims];
        $this->idToken = JWT::encode($claims, $this->privateKey, 'RS256', 'test-key');
        if ($this->badSignature) {
            $parts = explode('.', $this->idToken);
            $parts[2] = str_repeat('A', strlen($parts[2]));
            $this->idToken = implode('.', $parts);
        }

        return new JsonResponse(['id_token' => $this->idToken, 'access_token' => 'PRIVATE-ACCESS',
            'refresh_token' => 'PRIVATE-REFRESH', 'token_type' => 'Bearer', 'expires_in' => 300]);
    }
}
