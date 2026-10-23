<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prospection extends Model
{
    use HasFactory;

    protected $fillable = [
        'matricule',
        'date',
        'objet',
        'contact',
        'nom',
        'entreprise',
        'fonction',
        'produit',
        'type',
        'message',
        'etat',
        'editeur',
        'score',
    ];
}
