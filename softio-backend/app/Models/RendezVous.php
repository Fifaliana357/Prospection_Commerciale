<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RendezVous extends Model
{
    use HasFactory;

    protected $table = 'rendez_vous';

    protected $fillable = [
        'date',
        'heure',
        'prospect',
        'contact',
        'mode',
        'lieu',
        'commentaire',
        'statut',
    ];
}
