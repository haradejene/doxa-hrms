<?php

use Doxa\Laravel\Credentials\CredentialSchema;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Explicit opt-in; deploy a separate persistent SQLite/PostgreSQL connection.
        if (! config('doxa.credentials.enabled')) {
            throw new RuntimeException('Enable and configure Doxa managed credentials before installing their schema.');
        }
        CredentialSchema::create(DB::connection(config('doxa.credentials.connection'))->getSchemaBuilder(), config('doxa.credentials.table'));
    }

    public function down(): void
    {
        if (config('doxa.credentials.enabled')) {
            DB::connection(config('doxa.credentials.connection'))->getSchemaBuilder()->dropIfExists(config('doxa.credentials.table'));
        }
    }
};
