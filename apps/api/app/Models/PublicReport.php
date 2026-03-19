<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PublicReport extends Model
{
    protected $fillable = [
        'reference_id',
        'recognized_reporter_id',
        'reporter_nip',
        'reporter_alias',
        'student_name',
        'student_class',
        'student_nis',
        'summary',
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

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(RecognizedReporter::class, 'recognized_reporter_id');
    }
}
