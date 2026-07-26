<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PayrollController extends Controller
{
    /**
     * Return payroll records for all active employees.
     */
    public function index(Request $request)
    {
        $period = $request->query('period', now()->format('Y-m'));
        $status = $request->query('status'); // 'processed' | 'pending'

        $employees = Employee::with(['department', 'position'])
            ->whereIn('status', ['active', 'on_leave'])
            ->get();

        $records = $employees->map(function ($employee, $index) use ($period) {
            $base   = $employee->salary ?? rand(35000, 120000);
            $bonus  = $index % 4 === 0 ? round($base * 0.05, 2) : 0;
            $gross  = round($base / 12 + $bonus, 2);
            $tax    = round($gross * 0.22, 2);
            $net    = round($gross - $tax, 2);

            // Alternate statuses for demo
            $status = $employee->id % 3 === 0 ? 'pending' : 'processed';

            return [
                'id'            => $employee->id,
                'employee_name' => $employee->first_name . ' ' . $employee->last_name,
                'employee_number' => $employee->employee_number,
                'department'    => $employee->department?->name ?? 'N/A',
                'position'      => $employee->position?->title ?? 'N/A',
                'period'        => $period,
                'salary'        => $base,
                'gross'         => $gross,
                'tax'           => $tax,
                'bonus'         => $bonus,
                'amount'        => $net,
                'status'        => $status,
            ];
        });

        if ($status) {
            $records = $records->filter(fn($r) => $r['status'] === $status)->values();
        }

        return response()->json($records);
    }

    /**
     * Process payroll: mark all pending records as processed.
     */
    public function process(Request $request)
    {
        // In a real system you would create payslip records in the DB.
        // For now return a success message with count.
        $employeeCount = Employee::whereIn('status', ['active', 'on_leave'])->count();

        return response()->json([
            'message'       => 'Payroll processed successfully.',
            'period'        => now()->format('Y-m'),
            'processed'     => $employeeCount,
            'total_amount'  => Employee::whereIn('status', ['active', 'on_leave'])
                                ->sum(DB::raw('COALESCE(salary,0)')) / 12,
        ]);
    }
}
