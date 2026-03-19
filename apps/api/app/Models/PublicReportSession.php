<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PublicReportSession extends Model
{
    protected $fillable = [
        'recognized_reporter_id',
        'session_token_hash',
        'expires_at',
        'consumed_at',
    ];

    protected $hidden = [
        'session_token_hash',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'consumed_at' => 'datetime',
    ];

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(RecognizedReporter::class, 'recognized_reporter_id');
    }
}
