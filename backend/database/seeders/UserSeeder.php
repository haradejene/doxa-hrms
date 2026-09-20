<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local', 'testing')) {
            throw new \RuntimeException('Demo administrator seeding is disabled outside local/testing.');
        }

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
