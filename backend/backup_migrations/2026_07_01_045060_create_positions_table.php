<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('positions', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->foreignId('department_id')->constrained()->onDelete('cascade');
            $table->integer('min_salary')->nullable();
            $table->integer('max_salary')->nullable();
            $table->integer('open_positions')->default(0);
            $table->integer('filled_positions')->default(0);
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();
            
            $table->index(['department_id', 'is_active']);
            $table->index('title');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('positions');
    }
};