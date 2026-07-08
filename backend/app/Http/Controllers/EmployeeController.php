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
            'email' => 'required|email|unique:employees',
            'employee_number' => 'required|unique:employees',
            'hire_date' => 'required|date',
            'department_id' => 'nullable|exists:departments,id',
            'position_id' => 'nullable|exists:positions,id',
            'user_id' => 'required|exists:users,id',
        ]);

        $employee = Employee::create($validated);
        return response()->json($employee, 201);
    }
}