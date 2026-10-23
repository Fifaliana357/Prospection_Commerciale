<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SavTicket extends Model
{
    use HasFactory;

    protected $table = 'sav_tickets';

    protected $fillable = [
        'num',
        'client',
        'sujet',
        'priorite',
        'statut',
        'date',
    ];
}
