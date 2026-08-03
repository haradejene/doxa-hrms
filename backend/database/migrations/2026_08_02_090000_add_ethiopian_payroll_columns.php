<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payroll_runs', function (Blueprint $table) {
            // "2026-08" — one payroll run per calendar month.
            $table->string('period_key', 7)->nullable()->after('period');
            $table->timestamp('processed_at')->nullable()->after('approved_at');
            $table->decimal('total_income_tax', 15, 2)->default(0)->after('total_deductions');
            $table->decimal('total_pension_employee', 15, 2)->default(0)->after('total_income_tax');
            $table->decimal('total_pension_employer', 15, 2)->default(0)->after('total_pension_employee');

            $table->unique('period_key');
        });

        Schema::table('payroll_items', function (Blueprint $table) {
            // Snapshot of the employee as they were when the run was processed, so a
            // historical declaration sheet does not change when a record is edited.
            $table->string('employee_name')->nullable()->after('employee_id');
            $table->string('employee_number')->nullable()->after('employee_name');
            $table->string('position_title')->nullable()->after('employee_number');
            $table->date('hire_date')->nullable()->after('position_title');

            // The span of work this row is paying for. Normally the whole month, but
            // it starts at the hire date for somebody who joined mid-period.
            $table->date('period_start')->nullable()->after('hire_date');
            $table->date('period_end')->nullable()->after('period_start');

            $table->decimal('transport_allowance', 15, 2)->default(0)->after('allowances');
            $table->decimal('non_taxable_allowance', 15, 2)->default(0)->after('transport_allowance');
            $table->decimal('gross_pay', 15, 2)->default(0)->after('overtime_pay');
            $table->decimal('taxable_income', 15, 2)->default(0)->after('gross_pay');
            $table->decimal('pension_employee', 15, 2)->default(0)->after('tax');
            $table->decimal('pension_employer', 15, 2)->default(0)->after('pension_employee');
        });
    }

    public function down(): void
    {
        Schema::table('payroll_runs', function (Blueprint $table) {
            $table->dropUnique(['period_key']);
            $table->dropColumn([
                'period_key',
                'processed_at',
                'total_income_tax',
                'total_pension_employee',
                'total_pension_employer',
            ]);
        });

        Schema::table('payroll_items', function (Blueprint $table) {
            $table->dropColumn([
                'employee_name',
                'employee_number',
                'position_title',
                'hire_date',
                'period_start',
                'period_end',
                'transport_allowance',
                'non_taxable_allowance',
                'gross_pay',
                'taxable_income',
                'pension_employee',
                'pension_employer',
            ]);
        });
    }
};
