<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $table = 'notification';
    protected $primaryKey = 'id_notification';

    protected $fillable = [
        'id_admin', 'id_commercial', 'type', 'titre', 'sous_titre',
        'contenu', 'id_prospection', 'id_client', 'nom_client',
        'id_rdv', 'lu',
    ];

    protected $casts = [
        'lu' => 'boolean',
    ];
}
