<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Produit extends Model
{
    protected $table = 'produit';
    protected $primaryKey = 'id_produit';

    protected $fillable = [
        'id_admin',
        'reference',
        'designation',
        'description',
        'prix_unitaire',
        'mots_cles',
        'actif',
    ];

    protected $casts = [
        'actif' => 'boolean',
        'prix_unitaire' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'id_admin', 'id_admin');
    }

    public function interets(): HasMany
    {
        return $this->hasMany(Interet::class, 'id_produit', 'id_produit');
    }

    public function mouvementsStock(): HasMany
    {
        return $this->hasMany(StockMouvement::class, 'id_produit', 'id_produit');
    }

    public function historiquesPrix(): HasMany
    {
        return $this->hasMany(HistoriquePrix::class, 'id_produit', 'id_produit');
    }
}
