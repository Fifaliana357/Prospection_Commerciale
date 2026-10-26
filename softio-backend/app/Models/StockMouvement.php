<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMouvement extends Model
{
    protected $table = 'stock_mouvement';
    protected $primaryKey = 'id_mouvement';
    public $timestamps = false;

    protected $fillable = [
        'id_produit', 'id_admin', 'id_commercial',
        'type_mouvement', 'quantite', 'reference', 'commentaire', 'date_mouvement',
    ];

    protected $casts = [
        'quantite' => 'integer',
        'date_mouvement' => 'datetime',
    ];

    public function produit(): BelongsTo
    {
        return $this->belongsTo(Produit::class, 'id_produit', 'id_produit');
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
