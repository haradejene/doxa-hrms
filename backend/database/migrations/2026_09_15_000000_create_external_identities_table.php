<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('external_identities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $issuer = $table->string('issuer');
            $subject = $table->string('subject');
            if (Schema::getConnection()->getDriverName() === 'mysql') {
                $issuer->charset('utf8mb4')->collation('utf8mb4_bin');
                $subject->charset('utf8mb4')->collation('utf8mb4_bin');
            }
            $table->timestamps();

            $table->unique(['issuer', 'subject']);
            $table->index('user_id');
        });

        // Opaque identity keys must compare exact bytes, including trailing spaces.
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE external_identities MODIFY issuer VARBINARY(255) NOT NULL, MODIFY subject VARBINARY(255) NOT NULL');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('external_identities');
    }
};
