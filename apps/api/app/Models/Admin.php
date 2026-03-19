<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class Admin extends Model
{
    use HasApiTokens;

    protected $fillable = [
        'username',
        'password',
        'role',
        'email',
        'nip',
        'full_name',
        'login_challenge_hash',
        'login_challenge_expires_at',
        'login_token_hash',
        'login_token_expires_at',
    ];

    protected $hidden = ['password', 'login_challenge_hash', 'login_token_hash'];

    protected $casts = [
        'login_challenge_expires_at' => 'datetime',
        'login_token_expires_at' => 'datetime',
    ];

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isGuruBK(): bool
    {
        return $this->role === 'guru_bk';
    }

    public function isKepalaSekolah(): bool
    {
        return $this->role === 'kepala_sekolah';
    }

    public function canAccessReports(): bool
    {
        return $this->isGuruBK() || $this->isKepalaSekolah();
    }
}
