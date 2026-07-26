<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->query('date', now()->toDateString());
        
        $records = AttendanceRecord::with('employee')
            ->whereDate('date', $date)
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'employee_name' => $record->employee ? trim($record->employee->first_name . ' ' . $record->employee->last_name) : 'Unknown',
                    'date' => $record->date,
                    'status' => $record->status,
                    'check_in' => $record->check_in ? \Carbon\Carbon::parse($record->check_in)->format('H:i') : null,
                    'check_out' => $record->check_out ? \Carbon\Carbon::parse($record->check_out)->format('H:i') : null,
                ];
            });

        return response()->json($records);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'status' => 'required|in:present,absent,late,half_day,holiday,leave',
            'check_in' => 'nullable|date_format:H:i',
            'check_out' => 'nullable|date_format:H:i',
        ]);

        if (!empty($validated['check_in'])) {
            $validated['check_in'] = $validated['date'] . ' ' . $validated['check_in'] . ':00';
        }
        if (!empty($validated['check_out'])) {
            $validated['check_out'] = $validated['date'] . ' ' . $validated['check_out'] . ':00';
        }

        $record = AttendanceRecord::updateOrCreate(
            ['employee_id' => $validated['employee_id'], 'date' => $validated['date']],
            $validated
        );

        return response()->json(['message' => 'Attendance recorded successfully', 'record' => $record]);
    }
}
