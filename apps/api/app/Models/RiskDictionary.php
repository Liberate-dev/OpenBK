<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RiskDictionary extends Model
{
    protected $fillable = [
        'word',
        'risk_level',
        'weight',
    ];
}
