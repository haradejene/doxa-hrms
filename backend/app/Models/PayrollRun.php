<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollRun extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'period',
        'period_key',
        'start_date',
        'end_date',
        'payment_date',
        'total_gross_pay',
        'total_deductions',
        'total_income_tax',
        'total_pension_employee',
        'total_pension_employer',
        'total_net_pay',
        'employee_count',
        'status',
        'approved_by',
        'approved_at',
        'processed_at',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'start_date'             => 'date',
        'end_date'               => 'date',
        'payment_date'           => 'date',
        'approved_at'            => 'datetime',
        'processed_at'           => 'datetime',
        'paid_at'                => 'datetime',
        'total_gross_pay'        => 'decimal:2',
        'total_deductions'       => 'decimal:2',
        'total_income_tax'       => 'decimal:2',
        'total_pension_employee' => 'decimal:2',
        'total_pension_employer' => 'decimal:2',
        'total_net_pay'          => 'decimal:2',
    ];

    public function items()
    {
        return $this->hasMany(PayrollItem::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
