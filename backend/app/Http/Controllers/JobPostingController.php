<?php

namespace App\Http\Controllers;

use App\Models\JobPosting;
use Illuminate\Http\Request;

class JobPostingController extends Controller
{
    public function index()
    {
        $jobPostings = JobPosting::with(['department', 'position'])->get();
        return response()->json($jobPostings);
    }

    public function show($id)
    {
        $jobPosting = JobPosting::with(['department', 'position'])->findOrFail($id);
        return response()->json($jobPosting);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'requirements' => 'required|string',
            'department_id' => 'required|exists:departments,id',
            'position_id' => 'required|exists:positions,id',
            'type' => 'required|in:full_time,part_time,contract,remote,hybrid',
            'salary_min' => 'nullable|numeric',
            'salary_max' => 'nullable|numeric',
            'closing_date' => 'nullable|date',
            'status' => 'in:draft,published,closed,on_hold'
        ]);

        $jobPosting = JobPosting::create($validated);
        return response()->json($jobPosting, 201);
    }
}