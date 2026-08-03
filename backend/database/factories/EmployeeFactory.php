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
        $maleNames = ['Abebe', 'Bekele', 'Dawit', 'Elias', 'Fikre', 'Girum', 'Hailu', 'Kaleb', 'Lema', 'Mulugeta', 'Natnael', 'Sisay', 'Tewodros', 'Yared', 'Zelalem'];
        $femaleNames = ['Almaz', 'Betelhem', 'Chaltu', 'Eden', 'Fantu', 'Genet', 'Hanna', 'Kalkidan', 'Liyu', 'Makeda', 'Nardos', 'Samrawit', 'Tigist', 'Yordanos', 'Zinash'];
        $lastNames = ['Tadesse', 'Alemu', 'Haile', 'Tesfaye', 'Assefa', 'Worku', 'Tilahun', 'Girma', 'Bekele', 'Mekonnen', 'Getachew', 'Ayele', 'Desta'];

        $gender = $this->faker->randomElement(['male', 'female']);
        $firstName = $gender === 'male' ? $this->faker->randomElement($maleNames) : $this->faker->randomElement($femaleNames);
        $lastName = $this->faker->randomElement($lastNames);
        $email = strtolower($firstName . '.' . $lastName . '@doxa.com');

        return [
            'user_id' => User::factory(),
            'department_id' => Department::inRandomOrder()->first()->id ?? 1,
            'position_id' => Position::inRandomOrder()->first()->id ?? 1,
            'employee_number' => 'EMP-' . $this->faker->unique()->numberBetween(1000, 9999),
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => strtolower($firstName . '.' . $lastName . $this->faker->unique()->numberBetween(1, 9999) . '@doxa.com'),
            'personal_email' => strtolower($firstName . '.' . $lastName . $this->faker->unique()->numberBetween(1, 9999) . '@gmail.com'),
            'phone' => '+251 9' . $this->faker->numberBetween(10, 99) . ' ' . $this->faker->numberBetween(100, 999) . ' ' . $this->faker->numberBetween(100, 999),
            'gender' => $gender,
            'hire_date' => $this->faker->dateTimeBetween('-5 years', 'now')->format('Y-m-d'),
            'employment_type' => $this->faker->randomElement(['full_time', 'full_time', 'part_time', 'contract']),
            'status' => $this->faker->randomElement(['active', 'active', 'active', 'on_leave']),
            // Monthly basic salary in Birr — see config/payroll.php ('base_salary_basis').
            'base_salary' => $this->faker->randomFloat(2, 4500, 35000),
            'annual_leave_balance' => $this->faker->numberBetween(10, 25),
        ];
    }
}
