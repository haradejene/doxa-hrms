<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\PerformanceReview;
use Illuminate\Http\Request;

class PerformanceController extends Controller
{
    public function index(Request $request)
    {
        $query = PerformanceReview::with(['employee', 'reviewer']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('first_name', 'ilike', "%{$search}%")
                  ->orWhere('last_name', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('period') && $request->period !== 'all') {
            $query->where('period', $request->period);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $reviews = $query->latest('review_date')->get()->map(fn($r) => $this->format($r));

        return response()->json($reviews);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id'           => 'required|exists:employees,id',
            'reviewer_id'           => 'required|exists:employees,id',
            'review_date'           => 'required|date',
            'period'                => 'required|in:quarterly,annual,probation,mid_year',
            'period_start_date'     => 'required|date',
            'period_end_date'       => 'required|date|after_or_equal:period_start_date',
            'rating'                => 'nullable|integer|min:1|max:5',
            'strengths'             => 'nullable|string',
            'areas_for_improvement' => 'nullable|string',
            'goals_achieved'        => 'nullable|string',
            'goals_for_next_period' => 'nullable|string',
            'manager_comments'      => 'nullable|string',
            'employee_comments'     => 'nullable|string',
            'status'                => 'nullable|in:draft,submitted,reviewed,completed',
        ]);

        $validated['status'] = $validated['status'] ?? 'draft';

        $review = PerformanceReview::create($validated);
        $review->load(['employee', 'reviewer']);

        return response()->json($this->format($review), 201);
    }

    public function update(Request $request, $id)
    {
        $review = PerformanceReview::findOrFail($id);

        $validated = $request->validate([
            'employee_id'           => 'sometimes|exists:employees,id',
            'reviewer_id'           => 'sometimes|exists:employees,id',
            'review_date'           => 'sometimes|date',
            'period'                => 'sometimes|in:quarterly,annual,probation,mid_year',
            'period_start_date'     => 'sometimes|date',
            'period_end_date'       => 'sometimes|date',
            'rating'                => 'nullable|integer|min:1|max:5',
            'strengths'             => 'nullable|string',
            'areas_for_improvement' => 'nullable|string',
            'goals_achieved'        => 'nullable|string',
            'goals_for_next_period' => 'nullable|string',
            'manager_comments'      => 'nullable|string',
            'employee_comments'     => 'nullable|string',
            'status'                => 'nullable|in:draft,submitted,reviewed,completed',
        ]);

        $review->update($validated);
        $review->load(['employee', 'reviewer']);

        return response()->json($this->format($review));
    }

    public function destroy($id)
    {
        $review = PerformanceReview::findOrFail($id);
        $review->delete();

        return response()->json(['message' => 'Review deleted successfully']);
    }

    private function format(PerformanceReview $r): array
    {
        $emp = $r->employee;
        $rev = $r->reviewer;

        return [
            'id'                    => $r->id,
            'employee_id'           => $r->employee_id,
            'reviewer_id'           => $r->reviewer_id,
            'employee_name'         => $emp ? trim($emp->first_name . ' ' . $emp->last_name) : 'Unknown',
            'reviewer_name'         => $rev ? trim($rev->first_name . ' ' . $rev->last_name) : 'Unknown',
            'employee_department'   => $emp?->department?->name ?? 'N/A',
            'employee_position'     => $emp?->position?->title ?? 'N/A',
            'review_date'           => $r->review_date?->toDateString(),
            'period'                => $r->period,
            'period_start_date'     => $r->period_start_date?->toDateString(),
            'period_end_date'       => $r->period_end_date?->toDateString(),
            'rating'                => $r->rating,
            'score'                 => $r->rating,  // alias for frontend compat
            'strengths'             => $r->strengths,
            'areas_for_improvement' => $r->areas_for_improvement,
            'goals_achieved'        => $r->goals_achieved,
            'goals_for_next_period' => $r->goals_for_next_period,
            'manager_comments'      => $r->manager_comments,
            'employee_comments'     => $r->employee_comments,
            'status'                => $r->status,
            'created_at'            => $r->created_at?->toDateTimeString(),
        ];
    }
}
