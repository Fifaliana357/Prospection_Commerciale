<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommercialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id_commercial'  => $this->id_commercial,
            'id_admin'       => $this->id_admin,
            'nom'            => $this->nom,
            'prenom'         => $this->prenom,
            'email'          => $this->email,
            'telephone'      => $this->telephone,
            'theme_preference' => $this->theme_preference,
            'is_first_login' => $this->is_first_login,
            'actif'          => $this->actif,
            'created_at'     => $this->created_at?->toISOString(),
            'updated_at'     => $this->updated_at?->toISOString(),
        ];
    }
}