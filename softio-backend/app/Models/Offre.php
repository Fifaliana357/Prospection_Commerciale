<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Offre extends Model
{
    protected $table = 'offre';
    protected $primaryKey = 'id_offre';

    protected $fillable = [
        'id_admin',
        'denomination',
        'description',
        'tarif',
        'actif',
    ];

    protected $casts = [
        'actif' => 'boolean',
        'tarif' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'id_admin', 'id_admin');
    }

    public function prospections(): HasMany
    {
        return $this->hasMany(Prospection::class, 'id_offre', 'id_offre');
    }

    public function interets(): HasMany
    {
        return $this->hasMany(Interet::class, 'id_offre', 'id_offre');
    }
}
