<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\AllowedNis;
use App\Models\Student;
use App\Models\StudentPasswordResetRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class StudentAuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $request->merge([
            'nis' => preg_replace('/\s+/', '', (string) $request->input('nis')),
        ]);

        $validated = $request->validate([
            'nis' => ['bail', 'required', 'string', 'regex:/^\d{4,12}$/', 'max:12'],
            'password' => ['required', 'string', 'min:6', 'max:255'],
        ]);

        $nis = $validated['nis'];
        $password = $validated['password'];

        // Cek apakah NIS ada di daftar yang diizinkan sekolah
        $allowed = AllowedNis::where('nis', $nis)->exists();
        if (! $allowed) {
            return response()->json([
                'success' => false,
                'message' => 'NIS tidak terdaftar di sekolah. Hubungi guru BK.',
            ], 403);
        }

        $existing = Student::where('nis', $nis)->first();
        if ($existing) {
            if ($existing->password_reset_required) {
                $existing->password = Hash::make($password);
                $existing->password_reset_required = false;
                $existing->save();

                // Revoke old token (if any) and issue a fresh token after password recreation.
                $existing->tokens()->delete();
                $token = $existing->createToken('student-token')->plainTextToken;

                return response()->json([
                    'success' => true,
                    'sessionToken' => $token,
                    'message' => 'Password baru berhasil dibuat! Mengalihkan...',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'NIS sudah terdaftar. Silakan pindah ke tab Login.',
            ], 409);
        }

        $student = Student::create([
            'nis' => $nis,
            'password' => Hash::make($password),
            'password_reset_required' => false,
        ]);

        $token = $student->createToken('student-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'sessionToken' => $token,
            'message' => 'Pendaftaran berhasil! Mengalihkan...',
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->merge([
            'nis' => preg_replace('/\s+/', '', (string) $request->input('nis')),
        ]);

        $validated = $request->validate([
            'nis' => ['bail', 'required', 'string', 'regex:/^\d{4,12}$/', 'max:12'],
            'password' => ['required', 'string', 'min:6', 'max:255'],
        ]);

        $student = Student::where('nis', $validated['nis'])->first();

        if (! $student) {
            return response()->json([
                'success' => false,
                'message' => 'NIS tidak ditemukan atau password salah.',
            ], 401);
        }

        if ($student->password_reset_required) {
            return response()->json([
                'success' => false,
                'message' => 'Password akun ini telah direset admin. Silakan signup ulang untuk membuat password baru.',
            ], 403);
        }

        if (! Hash::check($validated['password'], $student->password)) {
            return response()->json([
                'success' => false,
                'message' => 'NIS tidak ditemukan atau password salah.',
            ], 401);
        }

        $token = $student->createToken('student-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'sessionToken' => $token,
            'message' => 'Login berhasil! Membuka gerbang...',
        ]);
    }

    public function requestPasswordReset(Request $request): JsonResponse
    {
        $request->merge([
            'nis' => preg_replace('/\s+/', '', (string) $request->input('nis')),
        ]);

        $validated = $request->validate([
            'nis' => ['bail', 'required', 'string', 'regex:/^\d{4,12}$/', 'max:12'],
        ]);

        $nis = $validated['nis'];
        $student = Student::where('nis', $nis)->first();

        if (! $student) {
            if (AllowedNis::where('nis', $nis)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'NIS ini belum punya akun. Gunakan Daftar Baru untuk membuat password pertama.',
                ], 409);
            }

            return response()->json([
                'success' => false,
                'message' => 'NIS tidak ditemukan. Periksa kembali atau hubungi guru BK.',
            ], 404);
        }

        if ($student->password_reset_required) {
            return response()->json([
                'success' => true,
                'message' => 'Akun ini sudah siap dibuatkan password baru. Silakan signup ulang setelah admin memproses reset.',
            ]);
        }

        $existingRequest = StudentPasswordResetRequest::query()
            ->where('nis', $nis)
            ->where('status', 'pending')
            ->first();

        if ($existingRequest) {
            return response()->json([
                'success' => true,
                'message' => 'Permintaan reset password sudah terkirim sebelumnya. Tunggu admin memprosesnya.',
            ]);
        }

        StudentPasswordResetRequest::create([
            'student_id' => $student->id,
            'nis' => $student->nis,
            'status' => 'pending',
        ]);

        ActivityLog::log(
            'student_reset_request',
            "Student NIS {$student->nis} requested password reset",
            null,
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Permintaan reset password berhasil dikirim ke admin. Tunggu konfirmasi lalu signup ulang.',
        ], 201);
    }
}
