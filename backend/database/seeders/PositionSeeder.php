<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Position;
use App\Models\Department;

class PositionSeeder extends Seeder
{
    public function run(): void
    {
        // Get departments or create them if they don't exist
        $engineering = Department::firstOrCreate(['code' => 'ENG'], ['name' => 'Engineering', 'description' => 'Software Development']);
        $hr = Department::firstOrCreate(['code' => 'HR'], ['name' => 'Human Resources', 'description' => 'People Management']);
        $finance = Department::firstOrCreate(['code' => 'FIN'], ['name' => 'Finance', 'description' => 'Financial Management']);
        $marketing = Department::firstOrCreate(['code' => 'MKT'], ['name' => 'Marketing', 'description' => 'Marketing & Branding']);
        $sales = Department::firstOrCreate(['code' => 'SAL'], ['name' => 'Sales', 'description' => 'Sales & Business Development']);

        $positions = [
            // Engineering
            [
                'title' => 'Software Engineer',
                'code' => 'SWE',
                'department_id' => $engineering->id,
                'min_salary' => 60000,
                'max_salary' => 90000,
                'open_positions' => 5,
                'filled_positions' => 3,
                'is_active' => true,
            ],
            [
                'title' => 'Senior Developer',
                'code' => 'SDEV',
                'department_id' => $engineering->id,
                'min_salary' => 90000,
                'max_salary' => 130000,
                'open_positions' => 2,
                'filled_positions' => 1,
                'is_active' => true,
            ],
            // HR
            [
                'title' => 'HR Manager',
                'code' => 'HRM',
                'department_id' => $hr->id,
                'min_salary' => 70000,
                'max_salary' => 100000,
                'open_positions' => 1,
                'filled_positions' => 1,
                'is_active' => true,
            ],
            [
                'title' => 'HR Coordinator',
                'code' => 'HRC',
                'department_id' => $hr->id,
                'min_salary' => 45000,
                'max_salary' => 65000,
                'open_positions' => 2,
                'filled_positions' => 1,
                'is_active' => true,
            ],
            // Finance
            [
                'title' => 'Finance Manager',
                'code' => 'FIM',
                'department_id' => $finance->id,
                'min_salary' => 80000,
                'max_salary' => 120000,
                'open_positions' => 1,
                'filled_positions' => 1,
                'is_active' => true,
            ],
            [
                'title' => 'Accountant',
                'code' => 'ACC',
                'department_id' => $finance->id,
                'min_salary' => 50000,
                'max_salary' => 70000,
                'open_positions' => 3,
                'filled_positions' => 2,
                'is_active' => true,
            ],
        ];

        foreach ($positions as $position) {
            Position::firstOrCreate(
                ['code' => $position['code']], // Check by code
                $position // Only create if code doesn't exist
            );
        }
    }
}