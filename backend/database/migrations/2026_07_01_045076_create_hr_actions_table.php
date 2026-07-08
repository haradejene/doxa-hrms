<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->string('action_type'); // warning, suspension, promotion, demotion, transfer, termination
            $table->string('title');
            $table->text('description');
            $table->date('action_date');
            $table->date('effective_date')->nullable();
            $table->date('end_date')->nullable();
            $table->text('reason')->nullable();
            $table->text('details')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_actions');
    }
};