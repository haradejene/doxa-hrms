<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = Employee::with(['user', 'department', 'position'])->get();
        return response()->json($employees);
    }

    public function show($id)
    {
        $employee = Employee::with(['user', 'department', 'position', 'manager'])
            ->findOrFail($id);
        return response()->json($employee);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'email' => 'required|email|unique:employees|unique:users,email',
            'employee_number' => 'required|unique:employees',
            'hire_date' => 'required|date',
            'department_id' => 'nullable|exists:departments,id',
            'position_id' => 'nullable|exists:positions,id',
            // Other fields the frontend might send
            'phone' => 'nullable|string',
            'employment_type' => 'nullable|in:full_time,part_time,contract,internship,temporary,consultant',
            'base_salary' => 'nullable|numeric',
        ]);

        $user = \App\Models\User::create([
            'name' => $validated['first_name'] . ' ' . $validated['last_name'],
            'email' => $validated['email'],
            'password' => bcrypt('password123'),
        ]);

        $validated['user_id'] = $user->id;

        $employee = Employee::create($validated);
        return response()->json($employee, 201);
    }

    public function update(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);
        
        $validated = $request->validate([
            'first_name' => 'sometimes|required|string',
            'last_name' => 'sometimes|required|string',
            'email' => 'sometimes|required|email|unique:employees,email,' . $id,
            'phone' => 'nullable|string',
            'employment_type' => 'nullable|string',
            'base_salary' => 'nullable|numeric',
            'status' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
            'position_id' => 'nullable|exists:positions,id',
        ]);

        $employee->update($validated);
        
        // Also update the user if needed
        if (isset($validated['first_name']) || isset($validated['last_name'])) {
            $firstName = $validated['first_name'] ?? $employee->first_name;
            $lastName = $validated['last_name'] ?? $employee->last_name;
            if ($employee->user) {
                $employee->user->update(['name' => $firstName . ' ' . $lastName]);
            }
        }
        if (isset($validated['email']) && $employee->user) {
            $employee->user->update(['email' => $validated['email']]);
        }

        return response()->json($employee);
    }
}