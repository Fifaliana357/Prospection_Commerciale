<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Offre extends Model
{
    protected $table = 'offre';
    protected $primaryKey = 'id_offre';

    protected $fillable = [
        'id_admin',
        'denomination',
        'description',
        'tarif',
        'actif',
    ];

    protected $casts = [
        'tarif' => 'decimal:2',
        'actif' => 'boolean',
    ];
}
