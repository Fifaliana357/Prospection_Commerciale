<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LigneVente extends Model
{
    protected $table = 'ligne_vente';
    protected $primaryKey = 'id_ligne_vente';

    public $timestamps = false;

    protected $fillable = [
        'id_vente',
        'id_produit',
        'id_offre',
        'designation',
        'description',
        'quantite',
        'prix_unitaire',
        'montant',
        'ordre',
    ];

    protected $casts = [
        'quantite' => 'float',
        'prix_unitaire' => 'integer',
        'montant' => 'integer',
        'ordre' => 'integer',
    ];

    public function vente(): BelongsTo
    {
        return $this->belongsTo(Vente::class, 'id_vente', 'id_vente');
    }

    public function produit(): BelongsTo
    {
        return $this->belongsTo(Produit::class, 'id_produit', 'id_produit');
    }

    public function offre(): BelongsTo
    {
        return $this->belongsTo(Offre::class, 'id_offre', 'id_offre');
    }
}
