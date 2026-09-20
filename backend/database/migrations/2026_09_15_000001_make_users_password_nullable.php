<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        match (Schema::getConnection()->getDriverName()) {
            'mysql' => DB::statement('ALTER TABLE users MODIFY password VARCHAR(255) NULL'),
            'pgsql' => DB::statement('ALTER TABLE users ALTER COLUMN password DROP NOT NULL'),
            'sqlite' => $this->changeSqlitePassword(true),
            default => throw new RuntimeException('Unsupported database driver for nullable users.password migration.'),
        };
    }

    public function down(): void
    {
        if (DB::table('users')->whereNull('password')->exists()) {
            throw new RuntimeException('Cannot restore NOT NULL while credentialless users exist.');
        }

        match (Schema::getConnection()->getDriverName()) {
            'mysql' => DB::statement('ALTER TABLE users MODIFY password VARCHAR(255) NOT NULL'),
            'pgsql' => DB::statement('ALTER TABLE users ALTER COLUMN password SET NOT NULL'),
            'sqlite' => $this->changeSqlitePassword(false),
            default => throw new RuntimeException('Unsupported database driver for nullable users.password migration.'),
        };
    }

    private function changeSqlitePassword(bool $nullable): void
    {
        // SQLite 3.35+: replace only the unindexed credential column, never users/id.
        DB::transaction(function () use ($nullable) {
            DB::statement('ALTER TABLE users RENAME COLUMN password TO federation_old_password');
            DB::statement('ALTER TABLE users ADD COLUMN password VARCHAR(255)'.($nullable ? ' NULL' : " NOT NULL DEFAULT ''"));
            DB::statement('UPDATE users SET password = federation_old_password');
            DB::statement('ALTER TABLE users DROP COLUMN federation_old_password');
        });
    }
};
