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

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'records' => 'required|array',
            'records.*.employee_id' => 'required|exists:employees,id',
            'records.*.status' => 'required|in:present,absent,late,half_day,holiday,leave',
            'records.*.check_in' => 'nullable|date_format:H:i',
            'records.*.check_out' => 'nullable|date_format:H:i',
        ]);

        $date = $validated['date'];
        
        foreach ($validated['records'] as $rec) {
            $data = $rec;
            $data['date'] = $date;
            
            if (!empty($data['check_in'])) {
                $data['check_in'] = $date . ' ' . $data['check_in'] . ':00';
            } else {
                $data['check_in'] = null;
            }
            
            if (!empty($data['check_out'])) {
                $data['check_out'] = $date . ' ' . $data['check_out'] . ':00';
            } else {
                $data['check_out'] = null;
            }

            AttendanceRecord::updateOrCreate(
                ['employee_id' => $data['employee_id'], 'date' => $date],
                $data
            );
        }

        return response()->json(['message' => 'Bulk attendance recorded successfully']);
    }
}
