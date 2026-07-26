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
        $title = $this->faker->jobTitle;
        
        return [
            'department_id' => Department::inRandomOrder()->first()->id ?? 1,
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
            'salary_min' => $this->faker->randomElement([50000, 60000, 70000]),
            'salary_max' => $this->faker->randomElement([90000, 120000, 150000]),
            'location' => $this->faker->randomElement(['remote', 'nyc', 'sf', 'london']),
            'posted_date' => $this->faker->dateTimeBetween('-1 month', 'now')->format('Y-m-d'),
            'status' => $this->faker->randomElement(['published', 'published', 'draft', 'closed']),
        ];
    }
}
