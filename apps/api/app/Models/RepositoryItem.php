<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RepositoryItem extends Model
{
    protected $fillable = [
        'title',
        'category',
        'summary',
        'content',
        'link_url',
        'created_by_admin_id',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by_admin_id');
    }
}
