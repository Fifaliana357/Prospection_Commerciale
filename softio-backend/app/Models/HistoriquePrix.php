<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistoriquePrix extends Model
{
    protected $table = 'historique_prix';
    protected $primaryKey = 'id_historique';
    public $timestamps = false;

    protected $fillable = [
        'id_produit', 'id_offre', 'prix_avant', 'prix_apres', 'date_maj',
    ];

    protected $casts = [
        'prix_avant' => 'integer',
        'prix_apres' => 'integer',
        'date_maj' => 'datetime',
    ];

    public function produit(): BelongsTo
    {
        return $this->belongsTo(Produit::class, 'id_produit', 'id_produit');
    }

    public function offre(): BelongsTo
    {
        return $this->belongsTo(Offre::class, 'id_offre', 'id_offre');
    }
}
