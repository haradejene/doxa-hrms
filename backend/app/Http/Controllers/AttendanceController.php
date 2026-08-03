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
                    'employee_id' => $record->employee_id,
                    'employee_name' => $record->employee ? trim($record->employee->first_name . ' ' . $record->employee->last_name) : 'Unknown',
                    'date' => $record->date,
                    'status' => $record->status,
                    'absence_reason' => $record->absence_reason,
                    'absence_note' => $record->notes,
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
            'status' => 'required|in:present,absent,late,half_day,holiday,leave,excused_absence',
            'check_in' => 'nullable|date_format:H:i',
            'check_out' => 'nullable|date_format:H:i',
            'absence_reason' => 'nullable|string',
            'absence_note' => 'nullable|string',
        ]);

        $data = $this->normalizeRecord($validated, $validated['date']);

        $record = AttendanceRecord::updateOrCreate(
            ['employee_id' => $data['employee_id'], 'date' => $data['date']],
            $data
        );

        return response()->json(['message' => 'Attendance recorded successfully', 'record' => $record]);
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'records' => 'required|array',
            'records.*.employee_id' => 'required|exists:employees,id',
            'records.*.status' => 'required|in:present,absent,late,half_day,holiday,leave,excused_absence',
            'records.*.check_in' => 'nullable|date_format:H:i',
            'records.*.check_out' => 'nullable|date_format:H:i',
            'records.*.absence_reason' => 'nullable|string',
            'records.*.absence_note' => 'nullable|string',
        ]);

        $date = $validated['date'];

        foreach ($validated['records'] as $rec) {
            $data = $this->normalizeRecord($rec, $date);

            AttendanceRecord::updateOrCreate(
                ['employee_id' => $data['employee_id'], 'date' => $date],
                $data
            );
        }

        return response()->json(['message' => 'Bulk attendance recorded successfully']);
    }

    /**
     * Expand H:i times into full timestamps and reconcile status with the absence reason:
     * an absence that carries a reason is an excused_absence, never a plain absence, and a
     * non-absent employee never keeps a stale reason from a previous save.
     */
    private function normalizeRecord(array $rec, string $date): array
    {
        $data = $rec;
        $data['date'] = $date;

        $data['check_in'] = !empty($data['check_in']) ? $date . ' ' . $data['check_in'] . ':00' : null;
        $data['check_out'] = !empty($data['check_out']) ? $date . ' ' . $data['check_out'] . ':00' : null;

        $reason = trim($data['absence_reason'] ?? '');
        $note = trim($data['absence_note'] ?? '');

        if (in_array($data['status'], ['absent', 'excused_absence'], true)) {
            $data['status'] = $reason !== '' ? 'excused_absence' : 'absent';
        } else {
            // Present / late / on-leave employees carry no absence reason.
            $reason = '';
            $note = '';
        }

        $data['absence_reason'] = $reason !== '' ? $reason : null;
        $data['notes'] = $note !== '' ? $note : null;
        unset($data['absence_note']);

        return $data;
    }
}