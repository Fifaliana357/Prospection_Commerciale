<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        Admin::firstOrCreate(
            ['email' => 'admin@test.com'],
            [
                'nom' => 'Admin',
                'prenom' => 'Principal',
                'telephone' => '0340000000',
                'entreprise' => 'Prospect',
                'password' => Hash::make('password'),
                'est_verifie' => true,
                'email_verification_required' => false,
                'theme_preference' => 'dark',
                'is_first_login' => false,
                'est_admin_site' => true,
            ],
        );
    }
}