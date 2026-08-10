<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobPosting extends Model
{
    use HasFactory;

    protected $guarded = [];

    /**
     * Most recently posted job first.
     *
     * posted_date is a date column, so everything posted today ties on it —
     * id descending breaks that tie and keeps the newest posting at the top.
     */
    public function scopeNewestFirst(Builder $query): Builder
    {
        return $query->orderByDesc('posted_date')->orderByDesc('id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function position()
    {
        return $this->belongsTo(Position::class);
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }
}
