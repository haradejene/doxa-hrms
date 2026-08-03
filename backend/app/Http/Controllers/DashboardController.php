<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\JobPosting;
use App\Models\Application;
use App\Models\LeaveRequest;
use App\Models\AttendanceRecord;
use App\Models\PayrollRun;
use App\Models\PayrollItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function metrics()
    {
        $totalEmployees = Employee::count();
        $openPositions = JobPosting::where('status', 'published')->count();
        $pendingApplications = Application::where('stage', 'applied')->count();
        $onLeaveToday = LeaveRequest::where('status', 'approved')
            ->whereDate('start_date', '<=', now())
            ->whereDate('end_date', '>=', now())
            ->count();

        // Department breakdown from real data
        $byDepartment = Employee::with('department')
            ->get()
            ->groupBy(fn($e) => $e->department?->name ?? 'Unassigned')
            ->map->count()
            ->sortByDesc(fn($v) => $v)
            ->take(5)
            ->toArray();

        // Status breakdown
        $activeEmployees = Employee::where('status', 'active')->count();
        $onLeaveEmployees = Employee::where('status', 'on_leave')->count();

        return response()->json([
            'totalEmployees'     => $totalEmployees,
            'openPositions'      => $openPositions,
            'pendingApplications' => $pendingApplications,
            'onLeaveToday'       => $onLeaveToday,
            'monthlyGrowth'      => 5.2,
            'turnover'           => 2.1,
            'activeEmployees'    => $activeEmployees,
            'onLeaveEmployees'   => $onLeaveEmployees,
            'byDepartment'       => $byDepartment,
        ]);
    }

    public function analytics()
    {
        // --- Workforce overview ---
        $totalEmployees   = Employee::count();
        $activeEmployees  = Employee::where('status', 'active')->count();
        $onLeaveEmployees = Employee::where('status', 'on_leave')->count();
        $openPositions    = JobPosting::where('status', 'published')->count();

        // Average salary
        $avgSalary = Employee::whereNotNull('base_salary')->avg('base_salary') ?? 0;

        // Total payroll from latest payroll run
        $latestRun     = PayrollRun::latest()->first();
        $totalPayroll  = $latestRun
            ? PayrollItem::where('payroll_run_id', $latestRun->id)->sum('gross_salary')
            : Employee::whereNotNull('base_salary')->sum('base_salary');

        // --- Status breakdown (for donut chart) ---
        $statusBreakdown = Employee::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn($r) => [$r->status => (int) $r->count]);

        // --- Department headcount (for bar chart) ---
        $byDepartment = Employee::with('department')
            ->get()
            ->groupBy(fn($e) => $e->department?->name ?? 'Unassigned')
            ->map->count()
            ->sortByDesc(fn($v) => $v)
            ->take(8)
            ->toArray();

        // --- Employment type breakdown ---
        $byEmploymentType = Employee::select('employment_type', DB::raw('count(*) as count'))
            ->groupBy('employment_type')
            ->get()
            ->mapWithKeys(fn($r) => [$r->employment_type => (int) $r->count]);

        // --- Monthly hiring trend (last 6 months) ---
        $hiringTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $count = Employee::whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->count();
            $hiringTrend[] = [
                'month' => $month->format('M'),
                'year'  => $month->year,
                'count' => $count,
            ];
        }

        // --- Applications pipeline ---
        $applicationStages = Application::select('stage', DB::raw('count(*) as count'))
            ->groupBy('stage')
            ->get()
            ->mapWithKeys(fn($r) => [$r->stage => (int) $r->count]);

        // --- Attendance summary (last 30 days) ---
        $thirtyDaysAgo = now()->subDays(30)->toDateString();
        $totalAttendance = AttendanceRecord::where('date', '>=', $thirtyDaysAgo)->count();
        $presentCount    = AttendanceRecord::where('date', '>=', $thirtyDaysAgo)
            ->whereIn('status', ['present', 'late'])->count();
        $attendanceRate  = $totalAttendance > 0
            ? round(($presentCount / $totalAttendance) * 100, 1)
            : 0;

        return response()->json([
            'overview' => [
                'totalEmployees'   => $totalEmployees,
                'activeEmployees'  => $activeEmployees,
                'onLeaveEmployees' => $onLeaveEmployees,
                'openPositions'    => $openPositions,
                'avgSalary'        => round($avgSalary, 2),
                'totalPayroll'     => round($totalPayroll, 2),
                'attendanceRate'   => $attendanceRate,
            ],
            'statusBreakdown'    => $statusBreakdown,
            'byDepartment'       => $byDepartment,
            'byEmploymentType'   => $byEmploymentType,
            'hiringTrend'        => $hiringTrend,
            'applicationStages'  => $applicationStages,
        ]);
    }

    public function recentEmployees()
    {
        $employees = Employee::with(['department', 'position'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($e) => [
                'id'         => $e->id,
                'name'       => $e->first_name . ' ' . $e->last_name,
                'email'      => $e->email,
                'department' => $e->department?->name ?? 'N/A',
                'position'   => $e->position?->title ?? 'N/A',
                'status'     => $e->status,
                'hire_date'  => $e->hire_date,
                'initials'   => strtoupper(substr($e->first_name, 0, 1) . substr($e->last_name, 0, 1)),
            ]);

        return response()->json($employees);
    }

    public function activities()
    {
        // Combine real recent employees with activity-like events
        $recentHires = Employee::with(['department'])->latest()->take(3)->get()->map(fn($e) => [
            'id'      => $e->id,
            'type'    => 'hire',
            'message' => "{$e->first_name} {$e->last_name} joined " . ($e->department?->name ?? 'the team'),
            'time'    => $e->created_at->diffForHumans(),
            'user'    => 'HR Admin',
        ]);

        $recentJobs = JobPosting::with(['department'])->latest()->take(2)->get()->map(fn($j) => [
            'id'      => 1000 + $j->id,
            'type'    => 'job',
            'message' => "New position posted: {$j->title}",
            'time'    => $j->created_at->diffForHumans(),
            'user'    => 'HR Admin',
        ]);

        return response()->json($recentHires->merge($recentJobs)->sortByDesc('id')->values());
    }

    public function notifications()
    {
        $recentApplications = Application::with('jobPosting')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($app) => [
                'id'      => $app->id,
                'type'    => 'application',
                'title'   => 'New job application',
                'message' => "{$app->first_name} {$app->last_name} applied for " . ($app->jobPosting?->title ?? 'a job'),
                'time'    => $app->created_at->diffForHumans(),
            ]);

        return response()->json($recentApplications);
    }
}
