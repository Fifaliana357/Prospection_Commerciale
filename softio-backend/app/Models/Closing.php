<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Closing extends Model
{
    protected $table = 'closing';
    protected $primaryKey = 'id_closing';

    protected $fillable = [
        'id_prospection',
        'id_client',
        'id_admin',
        'id_commercial',
        'produit',
        'description',
        'montant',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'id_client', 'id_client');
    }

    public function prospection(): BelongsTo
    {
        return $this->belongsTo(Prospection::class, 'id_prospection', 'id_prospection');
    }

    public function commercial(): BelongsTo
    {
        return $this->belongsTo(Commercial::class, 'id_commercial', 'id_commercial');
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'id_admin', 'id_admin');
    }
}
