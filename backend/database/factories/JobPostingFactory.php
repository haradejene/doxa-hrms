<?php

namespace Database\Factories;

use App\Models\JobPosting;
use App\Models\Department;
use App\Models\Position;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class JobPostingFactory extends Factory
{
    protected $model = JobPosting::class;

    public function definition(): array
    {
        $department = Department::inRandomOrder()->first();
        $deptId = $department->id ?? 1;
        $deptName = $department->name ?? 'Engineering';

        $titlesByDept = [
            'Engineering' => ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'QA Engineer'],
            'Human Resources' => ['HR Manager', 'Recruiter', 'HR Generalist', 'Benefits Specialist'],
            'Finance' => ['Financial Analyst', 'Accountant', 'Finance Manager'],
            'Marketing' => ['Marketing Specialist', 'Content Writer', 'SEO Strategist', 'Marketing Manager'],
            'Sales' => ['Sales Representative', 'Account Executive', 'Sales Manager'],
            'Operations' => ['Operations Manager', 'Logistics Coordinator', 'Supply Chain Analyst'],
            'Legal' => ['Legal Counsel', 'Compliance Officer'],
            'IT Support' => ['IT Support Specialist', 'System Administrator', 'Network Engineer'],
        ];

        $title = $this->faker->randomElement($titlesByDept[$deptName] ?? ['Staff Member', 'Associate', 'Manager']);
        
        return [
            'department_id' => $deptId,
            'position_id' => Position::inRandomOrder()->first()->id ?? 1,
            'created_by' => User::inRandomOrder()->first()->id ?? 1,
            'title' => $title,
            'slug' => Str::slug($title) . '-' . $this->faker->unique()->numberBetween(100, 999),
            'description' => $this->faker->paragraphs(3, true),
            'requirements' => $this->faker->paragraphs(2, true),
            'responsibilities' => $this->faker->paragraphs(2, true),
            'benefits' => $this->faker->paragraphs(1, true),
            'type' => $this->faker->randomElement(['full_time', 'part_time', 'contract', 'remote', 'hybrid']),
            'experience_level' => $this->faker->randomElement(['entry', 'junior', 'mid', 'senior', 'lead']),
            // Annual gross in Birr — the careers pages render this range as "/ yr".
            'salary_min' => $this->faker->randomElement([120000, 180000, 240000, 300000]),
            'salary_max' => $this->faker->randomElement([360000, 480000, 600000, 720000]),
            'location' => $this->faker->randomElement(['Remote', 'Addis Ababa', 'Hawassa', 'Dire Dawa', 'Bahir Dar', 'Adama', 'Mekelle', 'Bishoftu', 'Jimma']),
            'posted_date' => $this->faker->dateTimeBetween('-1 month', 'now')->format('Y-m-d'),
            'status' => $this->faker->randomElement(['published', 'published', 'draft', 'closed']),
        ];
    }
}
