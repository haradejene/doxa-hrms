<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Application extends Model
{
    use HasFactory, SoftDeletes;
    
    protected $fillable = [
        'job_posting_id',
        'user_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'resume_path',
        'cover_letter_path',
        'stage',
        'notes',
        'rating',
        'rejection_reason',
        'applied_at',
    ];
    
    public function jobPosting()
    {
        return $this->belongsTo(\App\Models\JobPosting::class);
    }
    
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
