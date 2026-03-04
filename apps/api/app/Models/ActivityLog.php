<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $fillable = [
        'admin_id',
        'action',
        'description',
        'ip_address',
    ];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class);
    }

    public static function log(string $action, ?string $description = null, ?int $adminId = null, ?string $ip = null): self
    {
        return self::create([
            'admin_id' => $adminId,
            'action' => $action,
            'description' => $description,
            'ip_address' => $ip,
        ]);
    }
}
