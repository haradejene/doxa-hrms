<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->foreignId('reviewer_id')->constrained('employees')->onDelete('cascade');
            $table->date('review_date');
            $table->string('period'); // quarterly, annual, probation
            $table->date('period_start_date');
            $table->date('period_end_date');
            $table->integer('rating')->nullable(); // 1-5
            $table->text('strengths')->nullable();
            $table->text('areas_for_improvement')->nullable();
            $table->text('goals_achieved')->nullable();
            $table->text('goals_for_next_period')->nullable();
            $table->text('manager_comments')->nullable();
            $table->text('employee_comments')->nullable();
            $table->enum('status', ['draft', 'submitted', 'reviewed', 'completed'])->default('draft');
            $table->timestamps();
            
            $table->index(['employee_id', 'period']);
            $table->index('review_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_reviews');
    }
};
