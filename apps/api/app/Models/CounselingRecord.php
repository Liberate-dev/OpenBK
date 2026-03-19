<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CounselingRecord extends Model
{
    protected $fillable = [
        'allowed_nis_id',
        'session_date',
        'start_time',
        'end_time',
        'service_type',
        'medium',
        'location',
        'topic',
        'objective',
        'assessment',
        'intervention',
        'result_summary',
        'follow_up_plan',
        'status',
        'next_follow_up_date',
        'created_by_admin_id',
    ];

    protected $casts = [
        'session_date' => 'date',
        'next_follow_up_date' => 'date',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(AllowedNis::class, 'allowed_nis_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by_admin_id');
    }
}
