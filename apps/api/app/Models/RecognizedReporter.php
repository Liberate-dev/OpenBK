<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RecognizedReporter extends Model
{
    protected $fillable = [
        'nip',
        'alias_name',
        'description',
        'is_active',
        'login_challenge_hash',
        'login_challenge_expires_at',
        'login_token_hash',
        'login_token_expires_at',
    ];

    protected $hidden = [
        'login_challenge_hash',
        'login_token_hash',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'login_challenge_expires_at' => 'datetime',
        'login_token_expires_at' => 'datetime',
    ];

    public function sessions(): HasMany
    {
        return $this->hasMany(PublicReportSession::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(PublicReport::class);
    }
}
