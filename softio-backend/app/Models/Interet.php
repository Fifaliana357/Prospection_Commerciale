<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Interet extends Model
{
    protected $table = 'interet';
    protected $primaryKey = 'id_interet';
    public $timestamps = false;

    protected $fillable = [
        'id_client', 'id_offre', 'id_produit', 'nom_libre',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'id_client', 'id_client');
    }

    public function offre(): BelongsTo
    {
        return $this->belongsTo(Offre::class, 'id_offre', 'id_offre');
    }

    public function produit(): BelongsTo
    {
        return $this->belongsTo(Produit::class, 'id_produit', 'id_produit');
    }
}
