<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'HR Admin',
                'email' => 'admin@doxa.com',
                'password' => Hash::make('SecurePass123'),
                'role' => 'hr_admin',
                'is_active' => true,
            ],
        ];

        foreach ($users as $user) {
            User::firstOrCreate(
                ['email' => $user['email']], // Check by email
                $user // Only create if email doesn't exist
            );
        }
    }
}