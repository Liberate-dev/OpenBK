<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Admin extends Model
{
    use HasApiTokens;

    protected $fillable = ['username', 'password', 'role', 'email', 'otp_code', 'otp_expires_at'];

    protected $hidden = ['password', 'otp_code'];

    protected $casts = [
        'otp_expires_at' => 'datetime',
    ];

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isGuruBK(): bool
    {
        return $this->role === 'guru_bk';
    }
}
