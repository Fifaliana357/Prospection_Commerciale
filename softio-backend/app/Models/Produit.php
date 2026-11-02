<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
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
        'photo',
        'actif',
    ];

    protected $casts = [
        'prix_unitaire' => 'decimal:2',
        'actif' => 'boolean',
    ];

    public function mouvementsStock(): HasMany
    {
        return $this->hasMany(StockMouvement::class, 'id_produit', 'id_produit');
    }
}
