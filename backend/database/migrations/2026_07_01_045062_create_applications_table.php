<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('job_posting_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email');
            $table->string('phone')->nullable();
            
            $table->string('resume_path')->nullable();
            $table->string('cover_letter_path')->nullable();
            $table->json('additional_documents')->nullable();
            
            $table->enum('stage', [
                'applied',
                'screening',
                'interview_scheduled',
                'interview_completed',
                'technical_test',
                'reference_check',
                'offer_extended',
                'offer_accepted',
                'offer_declined',
                'hired',
                'rejected'
            ])->default('applied');
            
            $table->text('notes')->nullable();
            $table->integer('rating')->nullable();
            
            $table->timestamp('applied_at');
            $table->timestamp('screening_completed_at')->nullable();
            $table->timestamp('interview_scheduled_at')->nullable();
            $table->timestamp('interview_completed_at')->nullable();
            $table->timestamp('offer_extended_at')->nullable();
            $table->timestamp('offer_accepted_at')->nullable();
            $table->timestamp('hired_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            
            $table->text('rejection_reason')->nullable();
            
            $table->softDeletes();
            $table->timestamps();
            
            $table->index(['job_posting_id', 'stage']);
            $table->index('email');
            $table->index('applied_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};