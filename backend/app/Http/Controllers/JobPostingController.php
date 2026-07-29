<?php

namespace App\Http\Controllers;

use App\Models\JobPosting;
use Illuminate\Http\Request;

class JobPostingController extends Controller
{
    public function index()
    {
        $jobPostings = JobPosting::with(['department', 'position'])
            ->where('status', 'published')
            ->get();
        return response()->json($jobPostings);
    }

    public function indexAll()
    {
        $jobPostings = JobPosting::with(['department', 'position'])->get();
        return response()->json($jobPostings);
    }

    public function show($id)
    {
        $jobPosting = JobPosting::with(['department', 'position']);
        
        if (is_numeric($id)) {
            $jobPosting = $jobPosting->where('id', (int)$id);
        } else {
            $jobPosting = $jobPosting->where('slug', $id);
        }
        
        return response()->json($jobPosting->firstOrFail());
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

    public function update(Request $request, $id)
    {
        $jobPosting = JobPosting::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'requirements' => 'sometimes|required|string',
            'responsibilities' => 'sometimes|string',
            'department_id' => 'sometimes|required|exists:departments,id',
            'location' => 'sometimes|required|string',
            'type' => 'sometimes|required|in:full_time,part_time,contract,remote,hybrid',
            'experience_level' => 'sometimes|string',
            'salary_min' => 'nullable|numeric',
            'salary_max' => 'nullable|numeric',
            'status' => 'sometimes|in:published,draft,closed,on_hold',
            'closing_date' => 'nullable|date',
        ]);

        $jobPosting->update($validated);
        return response()->json($jobPosting);
    }

    public function destroy($id)
    {
        $jobPosting = JobPosting::findOrFail($id);
        $jobPosting->delete();
        return response()->json(['message' => 'Job posting deleted'], 200);
    }
}