<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\User;
use App\Models\Department;
use App\Models\Position;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    public function definition(): array
    {
        $gender = $this->faker->randomElement(['male', 'female']);
        $firstName = $this->faker->firstName($gender);
        $lastName = $this->faker->lastName;
        $email = strtolower($firstName . '.' . $lastName . '@doxa.com');

        return [
            'user_id' => User::factory(),
            'department_id' => Department::inRandomOrder()->first()->id ?? 1,
            'position_id' => Position::inRandomOrder()->first()->id ?? 1,
            'employee_number' => 'EMP-' . $this->faker->unique()->numberBetween(1000, 9999),
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $this->faker->unique()->safeEmail,
            'personal_email' => $this->faker->unique()->safeEmail,
            'phone' => $this->faker->phoneNumber,
            'gender' => $gender,
            'hire_date' => $this->faker->dateTimeBetween('-5 years', 'now')->format('Y-m-d'),
            'employment_type' => $this->faker->randomElement(['full_time', 'full_time', 'part_time', 'contract']),
            'status' => $this->faker->randomElement(['active', 'active', 'active', 'on_leave']),
            'base_salary' => $this->faker->randomFloat(2, 40000, 150000),
            'annual_leave_balance' => $this->faker->numberBetween(10, 25),
        ];
    }
}
