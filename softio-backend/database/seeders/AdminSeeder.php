<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // updateOrCreate cherche par 'email'. S'il trouve, il met à jour. Sinon, il crée.
        Admin::updateOrCreate(
            ['email' => 'admin@test.com'], // Clé unique de recherche
            [
                'nom' => 'Admin',
                'prenom' => 'Principal',
                'telephone' => '0340000000',
                'entreprise' => 'Prospect',
                'password' => Hash::make('password'), // Attention: ça réinitialisera le mdp à chaque seed
                'est_verifie' => true,
                'theme_preference' => 'dark',
                'is_first_login' => false,
                'est_admin_site' => true,
            ]
        );
    }
}