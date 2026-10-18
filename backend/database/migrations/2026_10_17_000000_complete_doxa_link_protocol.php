<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Fail rather than silently discard pre-existing conflicting mappings.
        Schema::table('external_identities', function (Blueprint $table) {
            $table->unique(['user_id', 'issuer']);
            $table->string('pending_link_id', 64)->nullable()->unique();
        });
        Schema::table('doxa_link_transactions', function (Blueprint $table) {
            $table->text('credential_reference')->nullable();
            $table->string('client_id')->nullable();
            $table->string('attempt', 64)->nullable()->unique();
            $table->unsignedBigInteger('mapping_id')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('reconcile_after')->nullable()->index();
        });
        // Old identity-only callbacks cannot complete the managed protocol.
        DB::table('doxa_link_transactions')->whereIn('status', ['pending', 'verified', 'processing'])
            ->update(['status' => 'failed', 'consumed_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('external_identities', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'issuer']);
            $table->dropUnique(['pending_link_id']);
            $table->dropColumn('pending_link_id');
        });
        Schema::table('doxa_link_transactions', function (Blueprint $table) {
            $table->dropUnique(['attempt']);
            $table->dropIndex(['reconcile_after']);
            $table->dropColumn(['credential_reference', 'client_id', 'attempt', 'mapping_id', 'confirmed_at', 'reconcile_after']);
        });
    }
};
