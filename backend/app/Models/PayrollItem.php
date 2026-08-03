<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_run_id',
        'employee_id',
        'employee_name',
        'employee_number',
        'position_title',
        'hire_date',
        'period_start',
        'period_end',
        'base_salary',
        'allowances',
        'transport_allowance',
        'non_taxable_allowance',
        'bonuses',
        'overtime_pay',
        'gross_pay',
        'taxable_income',
        'deductions',
        'tax',
        'pension_employee',
        'pension_employer',
        'net_pay',
        'components',
        'notes',
        'payslip_path',
    ];

    protected $casts = [
        'hire_date'             => 'date',
        'period_start'          => 'date',
        'period_end'            => 'date',
        'components'            => 'array',
        'base_salary'           => 'decimal:2',
        'allowances'            => 'decimal:2',
        'transport_allowance'   => 'decimal:2',
        'non_taxable_allowance' => 'decimal:2',
        'bonuses'               => 'decimal:2',
        'overtime_pay'          => 'decimal:2',
        'gross_pay'             => 'decimal:2',
        'taxable_income'        => 'decimal:2',
        'deductions'            => 'decimal:2',
        'tax'                   => 'decimal:2',
        'pension_employee'      => 'decimal:2',
        'pension_employer'      => 'decimal:2',
        'net_pay'               => 'decimal:2',
    ];

    public function run()
    {
        return $this->belongsTo(PayrollRun::class, 'payroll_run_id');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
