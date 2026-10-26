<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Devis extends Model
{
    protected $table = 'devis';
    protected $primaryKey = 'id_devis';

    protected $fillable = [
        'id_admin',
        'id_commercial',
        'id_client',
        'id_entreprise',
        'numero',
        'type',
        'date_devis',
        'intitule',
        'montant_ht',
        'montant_ttc',
        'inclure_tva',
        'taux_tva',
        'statut',
        'methode_paiement',
        'modalites',
        'remarque',
    ];

    protected $casts = [
        'date_devis' => 'date',
        'montant_ht' => 'integer',
        'montant_ttc' => 'integer',
        'inclure_tva' => 'boolean',
        'taux_tva' => 'float',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'id_admin', 'id_admin');
    }

    public function commercial(): BelongsTo
    {
        return $this->belongsTo(Commercial::class, 'id_commercial', 'id_commercial');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'id_client', 'id_client');
    }

    public function entreprise(): BelongsTo
    {
        return $this->belongsTo(Entreprise::class, 'id_entreprise', 'id_entreprise');
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(LigneDevis::class, 'id_devis', 'id_devis')->orderBy('ordre');
    }

    public function vente(): HasOne
    {
        return $this->hasOne(Vente::class, 'id_devis', 'id_devis');
    }
}
