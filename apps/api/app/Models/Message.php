<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    protected $fillable = [
        'reference_id',
        'student_id',
        'body',
        'risk_level',
        'risk_score',
        'risk_tags',
        'is_read',
    ];

    protected $casts = [
        'risk_tags' => 'array',
        'is_read' => 'boolean',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function replies(): HasMany
    {
        return $this->hasMany(Reply::class);
    }
}
