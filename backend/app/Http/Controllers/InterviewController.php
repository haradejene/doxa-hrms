<?php

namespace App\Http\Controllers;

use App\Models\Interview;
use Illuminate\Http\Request;

class InterviewController extends Controller
{
    public function index()
    {
        $interviews = Interview::with(['application', 'interviewer'])->get();
        return response()->json($interviews);
    }

    public function show($id)
    {
        $interview = Interview::with(['application', 'interviewer'])->findOrFail($id);
        return response()->json($interview);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'application_id' => 'required|exists:applications,id',
            'interviewer_id' => 'required|exists:users,id',
            'scheduled_at' => 'required|date',
            'type' => 'required|in:phone,video,in_person,technical',
            'location' => 'nullable|string',
            'meeting_link' => 'nullable|url',
            'notes' => 'nullable|string',
        ]);

        $interview = Interview::create($validated);
        return response()->json($interview, 201);
    }
}