<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    protected $table = 'client';
    protected $primaryKey = 'id_client';

    protected $fillable = [
        'id_admin',
        'id_commercial',
        'matricule',
        'type',
        'nom',
        'prenom',
        'email',
        'telephone',
        'facebook',
        'linkedin',
        'entreprise',
        'poste',
        'classification',
        'profession',
        'site_web',
        'pays',
        'domaine',
    ];

    protected $casts = [
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

    public function prospections(): HasMany
    {
        return $this->hasMany(Prospection::class, 'id_client', 'id_client');
    }

    public function rendezVous(): HasMany
    {
        return $this->hasMany(RendezVous::class, 'id_client', 'id_client');
    }

    public function interets(): HasMany
    {
        return $this->hasMany(Interet::class, 'id_client', 'id_client');
    }

    public function devis(): HasMany
    {
        return $this->hasMany(Devis::class, 'id_client', 'id_client');
    }

    public function ventes(): HasMany
    {
        return $this->hasMany(Vente::class, 'id_client', 'id_client');
    }
}
