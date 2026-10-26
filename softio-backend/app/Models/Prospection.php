<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Prospection extends Model
{
    protected $table = 'prospection';
    protected $primaryKey = 'id_prospection';

    protected $fillable = [
        'id_admin',
        'id_commercial',
        'id_client',
        'id_offre',
        'produit_prospecte',
        'etat',
        'note_actuelle',
        'est_perdu',
    ];

    protected $casts = [
        'est_perdu' => 'boolean',
        'note_actuelle' => 'integer',
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

    public function offre(): BelongsTo
    {
        return $this->belongsTo(Offre::class, 'id_offre', 'id_offre');
    }

    public function propositions(): HasMany
    {
        return $this->hasMany(Proposition::class, 'id_prospection', 'id_prospection');
    }

    public function closing(): HasOne
    {
        return $this->hasOne(Closing::class, 'id_prospection', 'id_prospection');
    }
}
