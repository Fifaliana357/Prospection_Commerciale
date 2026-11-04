<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Livraison extends Model
{
    protected $table = 'livraison';

    protected $primaryKey = 'id_livraison';

    protected $fillable = [
        'id_vente',
        'adresse',
        'statut',
        'date_prevue',
        'date_livraison',
        'livreur',
        'commentaire',
    ];

    protected $casts = [
        'date_prevue' => 'date:Y-m-d',
        'date_livraison' => 'datetime',
    ];

    public function vente(): BelongsTo
    {
        return $this->belongsTo(Vente::class, 'id_vente', 'id_vente');
    }

    public function historique(): HasMany
    {
        return $this->hasMany(LivraisonHistorique::class, 'id_livraison', 'id_livraison')
            ->orderByDesc('created_at');
    }
}
