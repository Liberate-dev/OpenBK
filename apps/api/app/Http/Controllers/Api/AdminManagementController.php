<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Admin;
use App\Models\Student;
use App\Models\StudentPasswordResetRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Carbon;
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

        $users = Admin::select('id', 'username', 'role', 'nip', 'full_name', 'created_at')
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
            'nip' => trim((string) $request->input('nip')),
            'full_name' => trim((string) $request->input('full_name')),
        ]);

        $validated = $request->validate([
            'username' => ['bail', 'required', 'string', 'min:3', 'max:50', 'regex:/^[A-Za-z0-9_.-]+$/', 'unique:admins,username'],
            'password' => ['required', 'string', 'min:6', 'max:255'],
            'role' => ['required', Rule::in(['admin', 'guru_bk', 'kepala_sekolah'])],
            'nip' => ['required', 'string', 'regex:/^\d{5,30}$/', 'unique:admins,nip'],
            'full_name' => ['required', 'string', 'min:3', 'max:150'],
        ]);

        $admin = Admin::create([
            'username' => $validated['username'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'nip' => $validated['nip'],
            'full_name' => $validated['full_name'],
        ]);

        ActivityLog::log('create_user', "Created user {$admin->username} ({$admin->role})", $currentAdmin->id, $request->ip());

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $admin->id,
                'username' => $admin->username,
                'role' => $admin->role,
                'nip' => $admin->nip,
                'full_name' => $admin->full_name,
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

        $normalizedInput = [];

        if ($request->has('username')) {
            $normalizedInput['username'] = trim((string) $request->input('username'));
        }

        if ($request->has('nip')) {
            $normalizedInput['nip'] = trim((string) $request->input('nip'));
        }

        if ($request->has('full_name')) {
            $normalizedInput['full_name'] = trim((string) $request->input('full_name'));
        }

        if ($normalizedInput !== []) {
            $request->merge($normalizedInput);
        }

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
            'role' => ['sometimes', Rule::in(['admin', 'guru_bk', 'kepala_sekolah'])],
            'nip' => ['sometimes', 'filled', 'string', 'regex:/^\d{5,30}$/', Rule::unique('admins', 'nip')->ignore($id)],
            'full_name' => ['sometimes', 'filled', 'string', 'min:3', 'max:150'],
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
        if (array_key_exists('nip', $validated)) {
            $admin->nip = $validated['nip'];
        }
        if (array_key_exists('full_name', $validated)) {
            $admin->full_name = $validated['full_name'];
        }

        $admin->save();

        ActivityLog::log('update_user', "Updated user {$admin->username}", $currentAdmin->id, $request->ip());

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $admin->id,
                'username' => $admin->username,
                'role' => $admin->role,
                'nip' => $admin->nip,
                'full_name' => $admin->full_name,
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
            ->with([
                'passwordResetRequests' => fn ($query) => $query
                    ->where('status', 'pending')
                    ->orderByDesc('created_at'),
            ])
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
                    ? Carbon::parse($student->messages_max_created_at)->toISOString()
                    : null,
                'pendingResetRequestedAt' => $student->passwordResetRequests->first()?->created_at?->toISOString(),
            ]);

        return response()->json($students);
    }

    public function resetRequests(Request $request): JsonResponse
    {
        $currentAdmin = $request->user();
        if (! $currentAdmin instanceof Admin || ! $currentAdmin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $requests = StudentPasswordResetRequest::query()
            ->where('status', 'pending')
            ->with('student:id,nis')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (StudentPasswordResetRequest $resetRequest) => [
                'id' => $resetRequest->id,
                'nis' => $resetRequest->nis,
                'studentId' => $resetRequest->student_id,
                'requestedAt' => $resetRequest->created_at?->toISOString(),
                'updatedAt' => $resetRequest->updated_at?->toISOString(),
            ]);

        return response()->json($requests);
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

        StudentPasswordResetRequest::query()
            ->where('status', 'pending')
            ->where(function ($query) use ($student) {
                $query->where('student_id', $student->id)
                    ->orWhere('nis', $student->nis);
            })
            ->update([
                'status' => 'completed',
                'resolved_by_admin_id' => $currentAdmin->id,
                'resolved_at' => now(),
            ]);

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
