<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tutoriel extends Model
{
    protected $table = 'tutoriel';
    protected $primaryKey = 'id_tutoriel';

    protected $fillable = [
        'id_admin',
        'titre',
        'lien',
    ];
}
