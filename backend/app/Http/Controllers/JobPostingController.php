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
        $jobPosting = JobPosting::with(['department', 'position'])
            ->where('id', $id)
            ->orWhere('slug', $id)
            ->firstOrFail();
        return response()->json($jobPosting);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'requirements' => 'required|array',
            'responsibilities' => 'required|array',
            'department_id' => 'required',
            'location' => 'required|string',
            'type' => 'required|in:full_time,part_time,contract,remote,hybrid',
            'salary_min' => 'nullable|numeric',
            'salary_max' => 'nullable|numeric',
            'closing_date' => 'nullable|date',
        ]);

        $validated['requirements'] = implode("\n", $validated['requirements']);
        $validated['responsibilities'] = implode("\n", $validated['responsibilities']);
        $validated['slug'] = \Illuminate\Support\Str::slug($validated['title']) . '-' . time();
        $validated['posted_date'] = now();
        $validated['status'] = 'published';
        
        // Use an authenticated user or fallback to 1
        $validated['created_by'] = auth()->id() ?: 1;
        
        // Defaults for fields not sent by the frontend
        $validated['position_id'] = $request->input('position_id') ?: 1;
        $validated['experience_level'] = 'mid';

        $jobPosting = JobPosting::create($validated);
        return response()->json($jobPosting, 201);
    }
}