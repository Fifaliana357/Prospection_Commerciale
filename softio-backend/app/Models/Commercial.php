<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

class Commercial extends Authenticatable
{
    use HasApiTokens;

    protected $table = 'commercial';
    protected $primaryKey = 'id_commercial';

    protected $fillable = [
        'id_admin',
        'nom',
        'prenom',
        'email',
        'telephone',
        'password',
        'theme_preference',
        'pass_token',
        'is_first_login',
        'signature',
        'signature_width',
        'signature_height',
        'actif',
    ];

    protected $hidden = [
        'password',
        'pass_token',
    ];

    protected $casts = [
        'is_first_login' => 'boolean',
        'actif' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ===== Relations =====

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'id_admin', 'id_admin');
    }

    public function clients(): HasMany
    {
        return $this->hasMany(Client::class, 'id_commercial', 'id_commercial');
    }

    public function prospections(): HasMany
    {
        return $this->hasMany(Prospection::class, 'id_commercial', 'id_commercial');
    }

    public function propositions(): HasMany
    {
        return $this->hasMany(Proposition::class, 'id_commercial', 'id_commercial');
    }

    public function rendezVous(): HasMany
    {
        return $this->hasMany(RendezVous::class, 'id_commercial', 'id_commercial');
    }
}
