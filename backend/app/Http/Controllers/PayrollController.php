<?php

namespace App\Http\Controllers;

class PayrollController extends Controller
{
    public function index()
    {
        return response()->json([
            ['id' => 1, 'employee_name' => 'Alice Smith', 'period' => date('Y-m'), 'amount' => 5500.00, 'status' => 'processed'],
            ['id' => 2, 'employee_name' => 'Bob Johnson', 'period' => date('Y-m'), 'amount' => 4200.00, 'status' => 'processed'],
            ['id' => 3, 'employee_name' => 'Charlie Brown', 'period' => date('Y-m'), 'amount' => 6100.00, 'status' => 'pending'],
        ]);
    }
}
