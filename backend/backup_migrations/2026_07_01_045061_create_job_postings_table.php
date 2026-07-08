<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_postings', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('department_id')->constrained();
            $table->foreignId('position_id')->constrained();
            $table->foreignId('created_by')->constrained('users');
            
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');
            $table->text('requirements');
            $table->text('responsibilities');
            $table->text('benefits')->nullable();
            
            $table->enum('type', ['full_time', 'part_time', 'contract', 'remote', 'hybrid', 'internship']);
            $table->enum('experience_level', ['entry', 'junior', 'mid', 'senior', 'lead', 'executive']);
            
            $table->decimal('salary_min', 15, 2)->nullable();
            $table->decimal('salary_max', 15, 2)->nullable();
            $table->string('location')->nullable();
            
            $table->date('posted_date');
            $table->date('closing_date')->nullable();
            $table->enum('status', ['draft', 'published', 'closed', 'on_hold', 'cancelled'])->default('draft');
            
            $table->integer('views_count')->default(0);
            $table->integer('applications_count')->default(0);
            $table->integer('hired_count')->default(0);
            
            $table->softDeletes();
            $table->timestamps();
            
            $table->index(['status', 'posted_date']);
            $table->index('slug');
            $table->index('department_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_postings');
    }
};