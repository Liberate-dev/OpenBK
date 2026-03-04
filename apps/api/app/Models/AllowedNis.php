<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AllowedNis extends Model
{
    protected $table = 'allowed_nis';

    protected $fillable = ['nis', 'name'];
}
