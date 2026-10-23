<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BibliothequeFichier extends Model
{
    use HasFactory;

    protected $table = 'bibliotheque_fichiers';

    protected $fillable = [
        'nom',
        'type',
        'taille',
        'chemin_fichier',
        'date',
    ];
}
