<?php

namespace App\Http\Requests\Commercial;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommercialRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'nom'            => ['required', 'string', 'max:100'],
            'prenom'         => ['nullable', 'string', 'max:100'],
            'email'          => ['required', 'email', 'max:180', 'unique:commercial,email'],
            'password'       => ['required', 'string', 'min:6'],
            'telephone'      => ['nullable', 'string', 'max:30'],
            'theme_preference' => ['nullable', 'string', 'max:50'],
            'actif'          => ['boolean'],
        ];
    }
}