<?php

namespace App\Http\Requests\Commercial;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCommercialRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        // On récupère l'ID du commercial depuis la route pour ignorer son propre email lors de la vérification unique
        $commercialId = $this->route('commercial');

        return [
            'nom'            => ['sometimes', 'string', 'max:100'],
            'prenom'         => ['nullable', 'string', 'max:100'],
            'email'          => ['sometimes', 'email', 'max:180', Rule::unique('commercial', 'email')->ignore($commercialId, 'id_commercial')],
            'password'       => ['nullable', 'string', 'min:6'],
            'telephone'      => ['nullable', 'string', 'max:30'],
            'theme_preference' => ['nullable', 'string', 'max:50'],
            'actif'          => ['boolean'],
        ];
    }
}