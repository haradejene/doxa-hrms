<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceRecord extends Model
{
    protected $fillable = [
        'employee_id',
        'date',
        'check_in',
        'check_out',
        'check_in_ip',
        'check_out_ip',
        'total_hours',
        'overtime_hours',
        'status',
        'absence_reason',
        'notes'
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
