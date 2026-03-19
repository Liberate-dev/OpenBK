<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

class Student extends Model
{
    use HasApiTokens;

    protected $fillable = ['nis', 'password', 'password_reset_required'];

    protected $hidden = ['password'];

    protected $casts = [
        'password_reset_required' => 'boolean',
    ];

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function passwordResetRequests(): HasMany
    {
        return $this->hasMany(StudentPasswordResetRequest::class);
    }
}
