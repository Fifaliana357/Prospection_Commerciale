<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bibliotheque extends Model
{
    protected $table = 'bibliotheque';
    protected $primaryKey = 'id_fichier';
    public $timestamps = false;

    protected $fillable = [
        'id_admin', 'nom_fichier', 'type_fichier', 'chemin', 'taille',
    ];

    protected $casts = [
        'taille' => 'integer',
        'created_at' => 'datetime',
    ];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'id_admin', 'id_admin');
    }
}
