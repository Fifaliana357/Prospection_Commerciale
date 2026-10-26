<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Proposition extends Model
{
    protected $table = 'proposition';
    protected $primaryKey = 'id_proposition';

    public $timestamps = false; // on utilise date_proposition + created_at

    protected $fillable = [
        'id_prospection',
        'id_commercial',
        'id_admin',
        'date_proposition',
        'objet',
        'type',
        'message',
        'type_message',
        'note',
        'lu',
        'mail_uid',
        'score_ia',
        'label_ia',
    ];

    protected $casts = [
        'date_proposition' => 'datetime',
        'lu' => 'boolean',
        'note' => 'integer',
        'score_ia' => 'float',
        'created_at' => 'datetime',
    ];

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
