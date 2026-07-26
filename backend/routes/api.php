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
    
    // Job Posting routes (protected)
    Route::post('/jobs', [JobPostingController::class, 'store']);
    Route::put('/jobs/{id}', [JobPostingController::class, 'update']);
    Route::delete('/jobs/{id}', [JobPostingController::class, 'destroy']);
    
    // Application routes
    Route::get('/applications', [ApplicationController::class, 'index']);
    Route::get('/applications/{id}', [ApplicationController::class, 'show']);
    Route::post('/applications', [ApplicationController::class, 'store']);
    
    // Interview routes
    Route::get('/interviews', [InterviewController::class, 'index']);
    Route::get('/interviews/{id}', [InterviewController::class, 'show']);
    Route::post('/interviews', [InterviewController::class, 'store']);
    
    // Foundational modules
    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::post('/attendance', [AttendanceController::class, 'store']);
    Route::get('/payroll', [PayrollController::class, 'index']);
    Route::post('/payroll/process', [PayrollController::class, 'process']);
    Route::get('/performance', [PerformanceController::class, 'index']);
});