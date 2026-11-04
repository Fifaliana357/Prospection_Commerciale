<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LivraisonHistorique extends Model
{
    protected $table = 'livraison_historique';

    protected $primaryKey = 'id_historique';

    protected $fillable = [
        'id_livraison',
        'ancien_statut',
        'nouveau_statut',
        'commentaire',
        'id_admin',
        'id_commercial',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function livraison(): BelongsTo
    {
        return $this->belongsTo(Livraison::class, 'id_livraison', 'id_livraison');
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'id_admin', 'id_admin');
    }

    public function commercial(): BelongsTo
    {
        return $this->belongsTo(Commercial::class, 'id_commercial', 'id_commercial');
    }
}
