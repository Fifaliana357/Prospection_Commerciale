<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LigneDevis extends Model
{
    protected $table = 'ligne_devis';
    protected $primaryKey = 'id_ligne_devis';

    public $timestamps = false;

    protected $fillable = [
        'id_devis',
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

    public function devis(): BelongsTo
    {
        return $this->belongsTo(Devis::class, 'id_devis', 'id_devis');
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
