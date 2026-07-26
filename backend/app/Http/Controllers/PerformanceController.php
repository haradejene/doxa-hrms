<?php

namespace App\Http\Controllers;

class PerformanceController extends Controller
{
    public function index()
    {
        return response()->json([
            ['id' => 1, 'employee_name' => 'Alice Smith', 'reviewer' => 'Manager X', 'score' => 4.5, 'date' => date('Y-m-d'), 'status' => 'completed'],
            ['id' => 2, 'employee_name' => 'Bob Johnson', 'reviewer' => 'Manager Y', 'score' => 3.8, 'date' => date('Y-m-d'), 'status' => 'completed'],
            ['id' => 3, 'employee_name' => 'Charlie Brown', 'reviewer' => 'Manager Z', 'score' => null, 'date' => date('Y-m-d'), 'status' => 'in_progress'],
        ]);
    }
}
