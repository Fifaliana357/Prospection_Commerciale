<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Entreprise extends Model
{
    protected $table = 'entreprise';
    protected $primaryKey = 'id_entreprise';

    protected $fillable = [
        'id_admin',
        'nom_entreprise',
        'adresse',
        'telephone',
        'email',
        'nif',
        'stat',
        'rcs',
        'logo',
        'logo_width',
        'logo_height',
        'cachet',
        'cachet_width',
        'cachet_height',
        'par_defaut',
    ];

    protected $casts = [
        'par_defaut' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'id_admin', 'id_admin');
    }

    public function devis(): HasMany
    {
        return $this->hasMany(Devis::class, 'id_entreprise', 'id_entreprise');
    }

    public function ventes(): HasMany
    {
        return $this->hasMany(Vente::class, 'id_entreprise', 'id_entreprise');
    }
}
