<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LeaveType;

class LeaveTypeSeeder extends Seeder
{
    public function run(): void
    {
        $leaveTypes = [
            [
                'name' => 'Annual Leave',
                'code' => 'AL',
                'days_per_year' => 20,
                'is_paid' => true,
                'requires_approval' => true,
                'description' => 'Standard annual leave',
                'is_active' => true,
            ],
            [
                'name' => 'Sick Leave',
                'code' => 'SL',
                'days_per_year' => 10,
                'is_paid' => true,
                'requires_approval' => true,
                'description' => 'Sick leave for medical reasons',
                'is_active' => true,
            ],
            [
                'name' => 'Emergency Leave',
                'code' => 'EL',
                'days_per_year' => 5,
                'is_paid' => true,
                'requires_approval' => true,
                'description' => 'Emergency family leave',
                'is_active' => true,
            ],
            [
                'name' => 'Maternity Leave',
                'code' => 'ML',
                'days_per_year' => 90,
                'is_paid' => true,
                'requires_approval' => true,
                'description' => 'Maternity leave for new mothers',
                'is_active' => true,
            ],
            [
                'name' => 'Unpaid Leave',
                'code' => 'UL',
                'days_per_year' => 30,
                'is_paid' => false,
                'requires_approval' => true,
                'description' => 'Unpaid leave for personal reasons',
                'is_active' => true,
            ],
        ];

        foreach ($leaveTypes as $type) {
            LeaveType::firstOrCreate(
                ['code' => $type['code']], // Check by code
                $type // Only create if code doesn't exist
            );
        }
    }
}