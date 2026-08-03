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

        // Add excused_absence to the status enum (PostgreSQL uses CHECK constraint for enums)
        $driver = DB::connection()->getDriverName();
        if ($driver === 'pgsql') {
            // For PostgreSQL, we need to drop and recreate the check constraint
            DB::statement("ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_status_check");
            DB::statement("ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_status_check CHECK (status IN ('present', 'absent', 'late', 'half_day', 'holiday', 'leave', 'excused_absence'))");
        }
    }

    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropColumn('absence_reason');
        });

        // Restore original enum constraint
        $driver = DB::connection()->getDriverName();
        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_status_check");
            DB::statement("ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_status_check CHECK (status IN ('present', 'absent', 'late', 'half_day', 'holiday', 'leave'))");
        }
    }
};