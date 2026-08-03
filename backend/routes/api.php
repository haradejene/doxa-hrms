<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\JobPostingController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\InterviewController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PerformanceController;

// Public routes - NO authentication required
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Public job posting routes
Route::get('/jobs', [JobPostingController::class, 'index']);
Route::get('/jobs/{id}', [JobPostingController::class, 'show']);

// Public application submission (careers portal)
Route::post('/applications', [ApplicationController::class, 'store']);

// Protected routes - Authentication required
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Dashboard routes
    Route::get('/dashboard/metrics', [DashboardController::class, 'metrics']);
    Route::get('/dashboard/activities', [DashboardController::class, 'activities']);
    Route::get('/dashboard/recent-employees', [DashboardController::class, 'recentEmployees']);

    // Employee routes
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::get('/employees/{id}', [EmployeeController::class, 'show']);
    Route::post('/employees', [EmployeeController::class, 'store']);
    Route::put('/employees/{id}', [EmployeeController::class, 'update']);

    // Job Posting routes (protected)
    Route::get('/job-postings', [JobPostingController::class, 'indexAll']);
    Route::post('/job-postings', [JobPostingController::class, 'store']);
    Route::put('/job-postings/{id}', [JobPostingController::class, 'update']);
    Route::delete('/job-postings/{id}', [JobPostingController::class, 'destroy']);

    // Application routes (protected - HR/admin only)
    Route::get('/applications', [ApplicationController::class, 'index']);
    Route::get('/applications/{id}', [ApplicationController::class, 'show']);
    Route::put('/applications/{id}', [ApplicationController::class, 'update']);
    
    // Interview routes
    Route::get('/interviews', [InterviewController::class, 'index']);
    Route::get('/interviews/{id}', [InterviewController::class, 'show']);
    Route::post('/interviews', [InterviewController::class, 'store']);
    
    // Foundational modules
    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::post('/attendance', [AttendanceController::class, 'store']);
    Route::post('/attendance/bulk', [AttendanceController::class, 'bulkStore']);
    Route::get('/payroll', [PayrollController::class, 'index']);
    Route::get('/payroll/periods', [PayrollController::class, 'periods']);
    Route::post('/payroll/process', [PayrollController::class, 'process']);
    Route::get('/performance', [PerformanceController::class, 'index']);
});