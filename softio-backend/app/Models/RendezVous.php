<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RendezVous extends Model
{
    protected $table = 'rendez_vous';
    protected $primaryKey = 'id_rendez_vous';

    protected $fillable = [
        'id_admin',
        'id_commercial',
        'id_client',
        'date_rdv',
        'lieu',
        'type_rdv',
        'statut',
        'numero_rdv',
        'lien_rdv',
        'commentaire',
    ];

    protected $casts = [
        'date_rdv' => 'datetime',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'id_client', 'id_client');
    }

    public function commercial(): BelongsTo
    {
        return $this->belongsTo(Commercial::class, 'id_commercial', 'id_commercial');
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'id_admin', 'id_admin');
    }
}
