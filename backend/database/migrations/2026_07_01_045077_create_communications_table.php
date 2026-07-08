<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('communications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->string('type'); // email, letter, notification, memo
            $table->string('subject');
            $table->text('content');
            $table->string('reference_number')->nullable();
            $table->date('sent_date');
            $table->timestamp('read_at')->nullable();
            $table->enum('status', ['draft', 'sent', 'read', 'archived'])->default('draft');
            $table->json('attachments')->nullable();
            $table->timestamps();
            
            $table->index(['employee_id', 'status']);
            $table->index('sent_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('communications');
    }
};
