<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

class Admin extends Authenticatable
{
    use HasApiTokens;

    protected $table = 'admin';
    protected $primaryKey = 'id_admin';

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'telephone',
        'entreprise',
        'password',
        'token',
        'est_verifie',
        'theme_preference',
        'pass_token',
        'is_first_login',
        'nom_repertoire',
        'est_admin_site',
        'signature',
        'signature_width',
        'signature_height',
    ];

    protected $hidden = [
        'password',
        'token',
        'pass_token',
    ];

    protected $casts = [
        'est_verifie' => 'boolean',
        'is_first_login' => 'boolean',
        'est_admin_site' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ===== Relations =====

    public function commerciaux(): HasMany
    {
        return $this->hasMany(Commercial::class, 'id_admin', 'id_admin');
    }

    public function entreprises(): HasMany
    {
        return $this->hasMany(Entreprise::class, 'id_admin', 'id_admin');
    }

    public function clients(): HasMany
    {
        return $this->hasMany(Client::class, 'id_admin', 'id_admin');
    }

    public function offres(): HasMany
    {
        return $this->hasMany(Offre::class, 'id_admin', 'id_admin');
    }

    public function produits(): HasMany
    {
        return $this->hasMany(Produit::class, 'id_admin', 'id_admin');
    }

    public function prospections(): HasMany
    {
        return $this->hasMany(Prospection::class, 'id_admin', 'id_admin');
    }
}
