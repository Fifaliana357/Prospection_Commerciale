<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prospect extends Model
{
    use HasFactory;

    protected $fillable = [
        'matricule',
        'nom',
        'prenom',
        'type',
        'email',
        'contact',
        'entreprise',
        'poste',
        'classification',
        'pays',
        'domaine',
        'profession',
        'linkedin',
        'facebook',
        'siteweb',
        'interets',
    ];
}
