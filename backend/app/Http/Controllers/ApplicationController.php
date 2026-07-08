<?php

namespace App\Http\Controllers;

use App\Models\Application;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    public function index()
    {
        $applications = Application::with(['jobPosting', 'user'])->get();
        return response()->json($applications);
    }

    public function show($id)
    {
        $application = Application::with(['jobPosting', 'user'])->findOrFail($id);
        return response()->json($application);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'job_posting_id' => 'required|exists:job_postings,id',
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'email' => 'required|email',
            'phone' => 'nullable|string',
            'resume_path' => 'nullable|string',
            'cover_letter_path' => 'nullable|string',
        ]);

        $application = Application::create($validated);
        return response()->json($application, 201);
    }
}