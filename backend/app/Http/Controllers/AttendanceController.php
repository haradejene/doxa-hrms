<?php

namespace App\Http\Controllers;

class AttendanceController extends Controller
{
    public function index()
    {
        return response()->json([
            ['id' => 1, 'employee_name' => 'Alice Smith', 'date' => date('Y-m-d'), 'status' => 'present', 'check_in' => '09:00', 'check_out' => '17:00'],
            ['id' => 2, 'employee_name' => 'Bob Johnson', 'date' => date('Y-m-d'), 'status' => 'late', 'check_in' => '09:45', 'check_out' => '17:30'],
            ['id' => 3, 'employee_name' => 'Charlie Brown', 'date' => date('Y-m-d'), 'status' => 'absent', 'check_in' => null, 'check_out' => null],
        ]);
    }
}
