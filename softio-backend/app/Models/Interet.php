<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Interet extends Model
{
    protected $table = 'interet';
    protected $primaryKey = 'id_interet';

    protected $fillable = [
        'id_client',
        'produit_concerne',
        'niveau',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'id_client', 'id_client');
    }
}
