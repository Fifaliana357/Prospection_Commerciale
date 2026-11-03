<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ComptabiliteOperation extends Model
{
    protected $table = 'comptabilite_operation';
    protected $primaryKey = 'id_operation';

    protected $fillable = [
        'id_admin',
        'type',
        'montant',
        'motif',
        'date_operation',
        'piece_jointe',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'date_operation' => 'datetime',
    ];
}
