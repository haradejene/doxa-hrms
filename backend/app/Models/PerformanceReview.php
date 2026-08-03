<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PerformanceReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'reviewer_id',
        'review_date',
        'period',
        'period_start_date',
        'period_end_date',
        'rating',
        'strengths',
        'areas_for_improvement',
        'goals_achieved',
        'goals_for_next_period',
        'manager_comments',
        'employee_comments',
        'status',
    ];

    protected $casts = [
        'review_date'       => 'date',
        'period_start_date' => 'date',
        'period_end_date'   => 'date',
        'rating'            => 'integer',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
