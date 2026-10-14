<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('doxa_link_transactions', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            // Retain identifiers for audit even if a local record is deleted.
            $table->unsignedBigInteger('employee_id');
            $table->unsignedBigInteger('target_user_id');
            $table->unsignedBigInteger('admin_id');
            $table->string('session_binding', 64);
            $table->string('oauth_state_hash', 64)->nullable()->unique();
            $table->string('status')->default('pending');
            $table->text('identity')->nullable();
            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doxa_link_transactions');
    }
};
