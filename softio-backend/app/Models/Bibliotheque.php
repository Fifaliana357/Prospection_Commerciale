<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bibliotheque extends Model
{
    protected $table = 'bibliotheque';
    protected $primaryKey = 'id_fichier';

    protected $fillable = [
        'id_admin',
        'nom',
        'type',
        'chemin',
        'taille',
        'extension',
    ];
}
