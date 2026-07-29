<?php

namespace App\Http\Controllers;

use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ApplicationController extends Controller
{
    public function index(Request $request)
    {
        $query = Application::with(['jobPosting', 'user']);
        
        if ($request->has('job_posting_id')) {
            $query->where('job_posting_id', $request->query('job_posting_id'));
        }
        
        $applications = $query->get();
        return response()->json($applications);
    }

    public function show($id)
    {
        $application = Application::with(['jobPosting', 'user'])->findOrFail($id);
        return response()->json($application);
    }

    public function update(Request $request, $id)
    {
        $application = Application::findOrFail($id);
        
        $validated = $request->validate([
            'stage' => 'required|in:applied,screening,interview_scheduled,interview_completed,technical_test,reference_check,offer_extended,offer_accepted,offer_declined,hired,rejected',
        ]);
        
        $application->update($validated);
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
            'resume' => 'nullable|file|mimes:pdf,doc,docx|max:5120',
            'cover_letter' => 'nullable|string',
        ]);

        $data = [
            'job_posting_id' => $validated['job_posting_id'],
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'stage' => 'applied',
            'applied_at' => now(),
        ];

        if ($request->hasFile('resume')) {
            $path = $request->file('resume')->store('applications/resumes', 'public');
            $data['resume_path'] = '/storage/' . $path;
        }

        if (!empty($validated['cover_letter'])) {
            $path = 'applications/cover_letters/' . uniqid() . '.txt';
            Storage::disk('public')->put($path, $validated['cover_letter']);
            $data['cover_letter_path'] = '/storage/' . $path;
        }

        $application = Application::create($data);
        return response()->json($application, 201);
    }
}