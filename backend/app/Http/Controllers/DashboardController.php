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
            
        // Mocked trends for demonstration
        $monthlyGrowth = 5.2;
        $turnover = 2.1;

        return response()->json([
            'totalEmployees' => $totalEmployees,
            'openPositions' => $openPositions,
            'pendingApplications' => $pendingApplications,
            'onLeaveToday' => $onLeaveToday,
            'monthlyGrowth' => $monthlyGrowth,
            'turnover' => $turnover,
        ]);
    }
    
    public function activities()
    {
        // For now, return mock activities as actual audit logging might be complex to stitch here
        return response()->json([
            [ 'id' => 1, 'type' => 'hire', 'message' => 'John Doe was hired as Senior Developer', 'time' => '2 hours ago', 'user' => 'HR Admin' ],
            [ 'id' => 2, 'type' => 'leave', 'message' => 'Jane Smith requested sick leave', 'time' => '3 hours ago', 'user' => 'Employee' ],
            [ 'id' => 3, 'type' => 'application', 'message' => 'New application for Frontend Developer', 'time' => '5 hours ago', 'user' => 'Applicant' ],
        ]);
    }
}
