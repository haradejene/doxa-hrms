<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offboarding_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->date('notice_date')->nullable();
            $table->date('last_working_date');
            $table->date('separation_date');
            $table->string('separation_type'); // resignation, termination, retirement, mutual_agreement
            $table->text('reason')->nullable();
            $table->text('exit_interview_comments')->nullable();
            $table->boolean('assets_returned')->default(false);
            $table->date('assets_returned_date')->nullable();
            $table->boolean('accounts_deactivated')->default(false);
            $table->date('accounts_deactivated_date')->nullable();
            $table->boolean('final_payroll_processed')->default(false);
            $table->date('final_payroll_date')->nullable();
            $table->text('clearance_notes')->nullable();
            $table->json('checklist_items')->nullable();
            $table->enum('status', ['initiated', 'in_progress', 'completed', 'cancelled'])->default('initiated');
            $table->timestamps();
            
            $table->index(['employee_id', 'status']);
            $table->index('separation_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offboarding_records');
    }
};
