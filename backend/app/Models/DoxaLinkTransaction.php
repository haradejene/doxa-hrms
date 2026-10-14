<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class DoxaLinkTransaction extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $guarded = ['*'];
    protected $hidden = ['session_binding', 'oauth_state_hash', 'identity'];
    protected $casts = ['employee_id' => 'integer', 'target_user_id' => 'integer', 'admin_id' => 'integer',
        'identity' => 'encrypted:array', 'expires_at' => 'datetime', 'consumed_at' => 'datetime'];
}
