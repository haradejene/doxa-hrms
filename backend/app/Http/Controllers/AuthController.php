<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        try {
            Log::info('Registration attempt', $request->all());
            
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
                'role' => 'nullable|in:hr_admin,management,applicant'
            ]);

            Log::info('Validation passed', $validated);

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'] ?? 'applicant',
                'is_active' => true,
            ]);

            Log::info('User created', ['user_id' => $user->id]);

            $token = $user->createToken('auth_token')->plainTextToken;

            Log::info('Token created for user', ['user_id' => $user->id]);

            return response()->json([
                'user' => $user,
                'token' => $token,
                'message' => 'Registration successful'
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('Registration failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Registration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request)
    {
        try {
            Log::info('Login attempt', ['email' => $request->email]);
            
            $validated = $request->validate([
                'email' => 'required|email',
                'password' => 'required'
            ]);

            Log::info('Login validation passed');

            if (!Auth::attempt($validated)) {
                Log::warning('Login failed - invalid credentials', ['email' => $request->email]);
                return response()->json([
                    'message' => 'Invalid credentials'
                ], 401);
            }

            $user = Auth::user();
            Log::info('User authenticated', ['user_id' => $user->id, 'email' => $user->email]);
            
            // Revoke all existing tokens
            $user->tokens()->delete();
            
            // Create new token
            $token = $user->createToken('auth_token')->plainTextToken;

            Log::info('Token created for user', ['user_id' => $user->id]);

            return response()->json([
                'user' => $user,
                'token' => $token,
                'message' => 'Login successful'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Login failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Login failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();
            return response()->json(['message' => 'Logged out successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Logout failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function me(Request $request)
    {
        try {
            return response()->json($request->user());
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to get user info: ' . $e->getMessage()
            ], 500);
        }
    }

    public function changePassword(Request $request)
    {
        try {
            $validated = $request->validate([
                'current_password' => 'required|string',
                'password'         => ['required', 'confirmed', Password::min(8)],
            ]);

            $user = $request->user();

            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json(['message' => 'Current password is incorrect'], 422);
            }

            $user->update(['password' => Hash::make($validated['password'])]);

            // Revoke all tokens so user has to re-login
            $user->tokens()->where('id', '!=', $request->user()->currentAccessToken()->id)->delete();

            return response()->json(['message' => 'Password changed successfully']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Password change failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Password change failed: ' . $e->getMessage()], 500);
        }
    }

    public function updateProfile(Request $request)
    {
        try {
            $user = $request->user();

            $validated = $request->validate([
                'name'  => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
            ]);

            $user->update($validated);

            return response()->json(['message' => 'Profile updated successfully', 'user' => $user->fresh()]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Profile update failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Profile update failed: ' . $e->getMessage()], 500);
        }
    }
}