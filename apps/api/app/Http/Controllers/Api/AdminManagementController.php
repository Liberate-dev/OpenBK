<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Admin;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminManagementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $currentAdmin = $request->user();
        if (! $currentAdmin instanceof Admin || ! $currentAdmin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $users = Admin::select('id', 'username', 'role', 'email', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $currentAdmin = $request->user();
        if (! $currentAdmin instanceof Admin || ! $currentAdmin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $request->merge([
            'username' => trim((string) $request->input('username')),
            'email' => $request->has('email')
                ? trim((string) $request->input('email'))
                : null,
        ]);

        $validated = $request->validate([
            'username' => ['bail', 'required', 'string', 'min:3', 'max:50', 'regex:/^[A-Za-z0-9_.-]+$/', 'unique:admins,username'],
            'password' => ['required', 'string', 'min:6', 'max:255'],
            'role' => ['required', Rule::in(['admin', 'guru_bk'])],
            'email' => ['nullable', 'email:rfc', 'max:255'],
        ]);

        $admin = Admin::create([
            'username' => $validated['username'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'email' => $validated['email'] ?? null,
        ]);

        ActivityLog::log('create_user', "Created user {$admin->username} ({$admin->role})", $currentAdmin->id, $request->ip());

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $admin->id,
                'username' => $admin->username,
                'role' => $admin->role,
                'email' => $admin->email,
            ],
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $currentAdmin = $request->user();
        if (! $currentAdmin instanceof Admin || ! $currentAdmin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $admin = Admin::findOrFail($id);

        $request->merge([
            'username' => $request->has('username')
                ? trim((string) $request->input('username'))
                : $request->input('username'),
            'email' => $request->has('email')
                ? trim((string) $request->input('email'))
                : $request->input('email'),
        ]);

        $validated = $request->validate([
            'username' => [
                'sometimes',
                'filled',
                'string',
                'min:3',
                'max:50',
                'regex:/^[A-Za-z0-9_.-]+$/',
                Rule::unique('admins', 'username')->ignore($id),
            ],
            'password' => ['sometimes', 'filled', 'string', 'min:6', 'max:255'],
            'role' => ['sometimes', Rule::in(['admin', 'guru_bk'])],
            'email' => ['sometimes', 'nullable', 'email:rfc', 'max:255'],
        ]);

        if (array_key_exists('username', $validated)) {
            $admin->username = $validated['username'];
        }
        if (array_key_exists('password', $validated)) {
            $admin->password = Hash::make($validated['password']);
        }
        if (array_key_exists('role', $validated)) {
            $admin->role = $validated['role'];
        }
        if (array_key_exists('email', $validated)) {
            $admin->email = $validated['email'] ?: null;
        }

        $admin->save();

        ActivityLog::log('update_user', "Updated user {$admin->username}", $currentAdmin->id, $request->ip());

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $admin->id,
                'username' => $admin->username,
                'role' => $admin->role,
                'email' => $admin->email,
            ],
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $currentAdmin = $request->user();
        if (! $currentAdmin instanceof Admin || ! $currentAdmin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        if ($currentAdmin->id === $id) {
            return response()->json(['message' => 'Tidak bisa menghapus akun sendiri.'], 400);
        }

        $admin = Admin::findOrFail($id);
        $username = $admin->username;
        $admin->delete();

        ActivityLog::log('delete_user', "Deleted user {$username}", $currentAdmin->id, $request->ip());

        return response()->json(['success' => true]);
    }

    public function logs(Request $request): JsonResponse
    {
        $currentAdmin = $request->user();
        if (! $currentAdmin instanceof Admin || ! $currentAdmin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $logs = ActivityLog::with('admin:id,username')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(fn (ActivityLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'description' => $log->description,
                'adminName' => $log->admin->username ?? 'System',
                'ipAddress' => $log->ip_address,
                'createdAt' => $log->created_at->toISOString(),
            ]);

        return response()->json($logs);
    }

    public function students(Request $request): JsonResponse
    {
        $currentAdmin = $request->user();
        if (! $currentAdmin instanceof Admin || ! $currentAdmin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $students = Student::query()
            ->withCount('messages')
            ->withMax('messages', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Student $student) => [
                'id' => $student->id,
                'nis' => $student->nis,
                'messagesCount' => $student->messages_count,
                'status' => $student->password_reset_required ? 'reset_required' : 'active',
                'canLogin' => ! $student->password_reset_required,
                'createdAt' => $student->created_at?->toISOString(),
                'updatedAt' => $student->updated_at?->toISOString(),
                'lastMessageAt' => $student->messages_max_created_at
                    ? \Illuminate\Support\Carbon::parse($student->messages_max_created_at)->toISOString()
                    : null,
            ]);

        return response()->json($students);
    }

    public function resetStudentPassword(Request $request, int $id): JsonResponse
    {
        $currentAdmin = $request->user();
        if (! $currentAdmin instanceof Admin || ! $currentAdmin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $student = Student::findOrFail($id);
        $student->password = Hash::make(Str::random(40));
        $student->password_reset_required = true;
        $student->save();

        // Invalidate all active student sessions after forced reset.
        $student->tokens()->delete();

        ActivityLog::log(
            'reset_student_password',
            "Reset password for student NIS {$student->nis}",
            $currentAdmin->id,
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => "Password siswa {$student->nis} berhasil direset. Siswa harus signup ulang.",
        ]);
    }
}
