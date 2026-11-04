<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Commercial extends Authenticatable
{
    use HasApiTokens, Notifiable;

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
        'is_first_login',
        'signature',
        'signature_width',
        'signature_height',
        'actif',
    ];

    protected $hidden = ['password', 'pass_token'];

    protected $casts = [
        'actif' => 'boolean',
        'is_first_login' => 'boolean',
    ];

    public function admin()
    {
        return $this->belongsTo(Admin::class, 'id_admin', 'id_admin');
    }
}
