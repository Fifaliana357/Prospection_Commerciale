<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vente extends Model
{
    protected $table = 'vente';
    protected $primaryKey = 'id_vente';

    protected $fillable = [
        'id_admin',
        'id_commercial',
        'id_client',
        'id_entreprise',
        'id_devis',
        'numero',
        'type_document',
        'date_vente',
        'intitule',
        'montant_ht',
        'montant_ttc',
        'inclure_tva',
        'taux_tva',
        'statut',
        'methode_paiement',
        'modalites',
    ];

    protected $casts = [
        'date_vente' => 'datetime',
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

    public function devis(): BelongsTo
    {
        return $this->belongsTo(Devis::class, 'id_devis', 'id_devis');
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(LigneVente::class, 'id_vente', 'id_vente')->orderBy('ordre');
    }
}
