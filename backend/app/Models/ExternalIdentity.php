<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExternalIdentity extends Model
{
    use HasFactory;

    protected $fillable = [
        'issuer',
        'subject',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
