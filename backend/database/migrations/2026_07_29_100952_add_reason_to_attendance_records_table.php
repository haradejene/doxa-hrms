<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add absence_reason column
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->text('absence_reason')->nullable()->after('status');
        });

        // Add excused_absence to the enum (PostgreSQL)
        DB::statement("ALTER TYPE attendance_records_status_enum ADD VALUE IF NOT EXISTS 'excused_absence'");
    }

    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropColumn('absence_reason');
        });

        // Note: Cannot easily remove enum value in PostgreSQL, so we skip that in down()
    }
};