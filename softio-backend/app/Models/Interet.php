<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Interet extends Model
{
    use HasFactory;

    protected $fillable = [
        'prospect',
        'type',
        'produit',
        'typeOffre',
        'date',
        'niveau',
        'commentaire',
    ];
}
