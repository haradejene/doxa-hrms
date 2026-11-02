<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserAccessController extends Controller
{
    /**
     * List all users with their role, status, and linked Doxa SSO identities.
     */
    public function index(Request $request)
    {
        $search = strtolower(trim((string) $request->query('search', '')));

        $query = User::with(['externalIdentities' => function ($q) {
            $q->select('id', 'user_id', 'issuer', 'subject');
        }]);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(email) LIKE ?', ["%{$search}%"]);
            });
        }

        $users = $query->orderBy('id', 'asc')->get();

        $formatted = $users->map(function ($u) use ($request) {
            $hasDoxa = $u->externalIdentities->isNotEmpty();
            $doxaIdentity = $u->externalIdentities->first();

            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                'is_active' => (bool) $u->is_active,
                'has_access' => $u->role === 'hr_admin' || $u->role === 'management',
                'is_current_user' => $request->user()?->id === $u->id,
                'is_root_admin' => strtolower($u->email) === 'admin@doxa.com',
                'auth_type' => $hasDoxa ? 'doxa_sso' : 'direct',
                'doxa_subject' => $doxaIdentity?->subject,
                'doxa_issuer' => $doxaIdentity?->issuer,
                'created_at' => $u->created_at?->toISOString(),
            ];
        });

        return response()->json($formatted);
    }

    /**
     * Grant or revoke HRM access for a user.
     */
    public function updateAccess(Request $request, $id)
    {
        $validated = $request->validate([
            'granted' => 'nullable|boolean',
            'role' => ['nullable', Rule::in(['hr_admin', 'management', 'applicant'])],
        ]);

        $actor = $request->user();
        $target = User::findOrFail($id);

        // Security check: Cannot revoke own access
        if ($actor && $actor->id === $target->id && (
            (isset($validated['granted']) && !$validated['granted']) ||
            (isset($validated['role']) && $validated['role'] === 'applicant')
        )) {
            return response()->json([
                'message' => 'You cannot revoke your own administrator access.',
            ], 422);
        }

        // Security check: Cannot revoke primary root admin (admin@doxa.com)
        if (strtolower($target->email) === 'admin@doxa.com' && (
            (isset($validated['granted']) && !$validated['granted']) ||
            (isset($validated['role']) && $validated['role'] === 'applicant')
        )) {
            return response()->json([
                'message' => 'The primary Doxa administrator account cannot have access revoked.',
            ], 422);
        }

        // Determine target role
        if (isset($validated['role'])) {
            $newRole = $validated['role'];
        } elseif (isset($validated['granted'])) {
            $newRole = $validated['granted'] ? 'hr_admin' : 'applicant';
        } else {
            return response()->json(['message' => 'Either granted flag or role is required.'], 422);
        }

        $target->role = $newRole;
        if ($newRole === 'hr_admin' || $newRole === 'management') {
            $target->is_active = true;
        }
        $target->save();

        $granted = ($newRole === 'hr_admin' || $newRole === 'management');
        $message = $granted
            ? "Granted access to {$target->name} ({$target->email}). They can now access HRM employee and management features."
            : "Revoked HRM access from {$target->name} ({$target->email}).";

        return response()->json([
            'success' => true,
            'message' => $message,
            'user' => [
                'id' => $target->id,
                'name' => $target->name,
                'email' => $target->email,
                'role' => $target->role,
                'is_active' => (bool) $target->is_active,
                'has_access' => $granted,
            ],
        ]);
    }
}
