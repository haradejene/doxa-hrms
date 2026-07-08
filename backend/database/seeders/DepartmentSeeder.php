<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['name' => 'Engineering', 'code' => 'ENG', 'description' => 'Software Development'],
            ['name' => 'Human Resources', 'code' => 'HR', 'description' => 'People Management'],
            ['name' => 'Finance', 'code' => 'FIN', 'description' => 'Financial Management'],
            ['name' => 'Marketing', 'code' => 'MKT', 'description' => 'Marketing & Branding'],
            ['name' => 'Sales', 'code' => 'SAL', 'description' => 'Sales & Business Development'],
            ['name' => 'Operations', 'code' => 'OPS', 'description' => 'Operations & Logistics'],
            ['name' => 'Legal', 'code' => 'LEG', 'description' => 'Legal & Compliance'],
            ['name' => 'IT Support', 'code' => 'ITS', 'description' => 'IT Support & Infrastructure'],
        ];

        foreach ($departments as $department) {
            // Use firstOrCreate to prevent duplicates
            Department::firstOrCreate(
                ['code' => $department['code']], // Check by code
                $department // Only create if code doesn't exist
            );
        }
    }
}