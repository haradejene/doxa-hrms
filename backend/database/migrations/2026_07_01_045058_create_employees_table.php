<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            
            // Relationships
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('department_id')->nullable();
            $table->foreignId('position_id')->nullable();
            $table->foreignId('manager_id')->nullable();
            
            // Personal Information
            $table->string('employee_number')->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('personal_email')->nullable();
            $table->string('phone')->nullable();
            $table->string('alternative_phone')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'other', 'prefer_not_to_say'])->nullable();
            $table->string('nationality')->nullable();
            $table->string('marital_status')->nullable();
            
            // Address
            $table->text('current_address')->nullable();
            $table->text('permanent_address')->nullable();
            
            // Employment Details
            $table->date('hire_date');
            $table->date('probation_end_date')->nullable();
            $table->date('contract_start_date')->nullable();
            $table->date('contract_end_date')->nullable();
            $table->enum('employment_type', ['full_time', 'part_time', 'contract', 'internship', 'temporary', 'consultant']);
            $table->enum('status', ['active', 'on_leave', 'suspended', 'terminated', 'resigned', 'probation'])->default('probation');
            
            // Financial Information
            $table->decimal('base_salary', 15, 2)->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->string('bank_routing_number')->nullable();
            $table->string('tax_id')->nullable();
            
            // Benefits
            $table->integer('annual_leave_balance')->default(0);
            $table->integer('sick_leave_balance')->default(0);
            $table->integer('paid_leave_balance')->default(0);
            
            // Emergency Contact
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->string('emergency_contact_relationship')->nullable();
            
            // Additional
            $table->json('skills')->nullable();
            $table->json('qualifications')->nullable();
            $table->json('documents')->nullable();
            
            $table->softDeletes();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['department_id', 'status']);
            $table->index('employee_number');
            $table->index(['first_name', 'last_name']);
            $table->index('email');
            $table->index('hire_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};