<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\JobPosting;
use App\Models\Application;
use App\Models\LeaveRequest;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function metrics()
    {
        $totalEmployees = Employee::count();
        $openPositions = JobPosting::where('status', 'published')->count();
        $pendingApplications = Application::where('status', 'applied')->count();
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
            'totalEmployees' => $totalEmployees,
            'openPositions' => $openPositions,
            'pendingApplications' => $pendingApplications,
            'onLeaveToday' => $onLeaveToday,
            'monthlyGrowth' => 5.2,
            'turnover' => 2.1,
            'activeEmployees' => $activeEmployees,
            'onLeaveEmployees' => $onLeaveEmployees,
            'byDepartment' => $byDepartment,
        ]);
    }

    public function recentEmployees()
    {
        $employees = Employee::with(['department', 'position'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($e) => [
                'id' => $e->id,
                'name' => $e->first_name . ' ' . $e->last_name,
                'email' => $e->email,
                'department' => $e->department?->name ?? 'N/A',
                'position' => $e->position?->title ?? 'N/A',
                'status' => $e->status,
                'hire_date' => $e->hire_date,
                'initials' => strtoupper(substr($e->first_name, 0, 1) . substr($e->last_name, 0, 1)),
            ]);

        return response()->json($employees);
    }

    public function activities()
    {
        // Combine real recent employees with activity-like events
        $recentHires = Employee::with(['department'])->latest()->take(3)->get()->map(fn($e) => [
            'id' => $e->id,
            'type' => 'hire',
            'message' => "{$e->first_name} {$e->last_name} joined " . ($e->department?->name ?? 'the team'),
            'time' => $e->created_at->diffForHumans(),
            'user' => 'HR Admin',
        ]);

        $recentJobs = JobPosting::with(['department'])->latest()->take(2)->get()->map(fn($j) => [
            'id' => 1000 + $j->id,
            'type' => 'job',
            'message' => "New position posted: {$j->title}",
            'time' => $j->created_at->diffForHumans(),
            'user' => 'HR Admin',
        ]);

        return response()->json($recentHires->merge($recentJobs)->sortByDesc('id')->values());
    }
}
