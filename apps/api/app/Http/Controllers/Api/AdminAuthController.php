<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Admin;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->merge([
            'username' => trim((string) $request->input('username')),
        ]);

        $validated = $request->validate([
            'username' => ['bail', 'required', 'string', 'min:3', 'max:50', 'regex:/^[A-Za-z0-9_.-]+$/'],
            'password' => ['required', 'string', 'min:6', 'max:255'],
        ]);

        $admin = Admin::where('username', $validated['username'])->first();

        if (! $admin || ! Hash::check($validated['password'], $admin->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Username atau password salah.',
            ], 401);
        }

        if (empty($admin->nip) || empty($admin->full_name)) {
            return response()->json([
                'success' => false,
                'message' => 'Akun admin belum memiliki NIP atau nama lengkap. Hubungi Admin IT.',
            ], 403);
        }

        $challengeToken = Str::random(64);

        $admin->forceFill([
            'login_challenge_hash' => Hash::make($challengeToken),
            'login_challenge_expires_at' => Carbon::now()->addMinutes(5),
            'login_token_hash' => null,
            'login_token_expires_at' => null,
        ])->save();

        ActivityLog::log('login', "{$admin->username} passed primary login", $admin->id, $request->ip());

        return response()->json([
            'success' => true,
            'requires_token' => true,
            'challenge_id' => $admin->id,
            'challenge_token' => $challengeToken,
            'message' => 'Username dan password valid. Silakan generate token login.',
        ]);
    }

    public function generateToken(Request $request): JsonResponse
    {
        $request->merge([
            'nip' => trim((string) $request->input('nip')),
            'full_name' => trim((string) $request->input('full_name')),
        ]);

        $validated = $request->validate([
            'challenge_id' => ['required', 'integer', 'min:1', 'exists:admins,id'],
            'challenge_token' => ['required', 'string', 'min:40', 'max:255'],
            'nip' => ['required', 'string', 'regex:/^\d{5,30}$/'],
            'full_name' => ['required', 'string', 'min:3', 'max:150'],
        ]);

        $admin = $this->resolveChallengeAdmin((int) $validated['challenge_id'], $validated['challenge_token']);

        if (! $admin) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi login tidak valid atau sudah kadaluarsa. Silakan login ulang.',
            ], 400);
        }

        if (
            $admin->nip !== $validated['nip']
            || $this->normalizeFullName((string) $admin->full_name) !== $this->normalizeFullName($validated['full_name'])
        ) {
            return response()->json([
                'success' => false,
                'message' => 'NIP atau nama lengkap tidak sesuai.',
            ], 401);
        }

        $loginToken = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $admin->forceFill([
            'login_token_hash' => Hash::make($loginToken),
            'login_token_expires_at' => Carbon::now()->addMinutes(5),
            'login_challenge_expires_at' => Carbon::now()->addMinutes(5),
        ])->save();

        ActivityLog::log('token_generated', "Generated login token for {$admin->username}", $admin->id, $request->ip());

        return response()->json([
            'success' => true,
            'generated_token' => $loginToken,
            'message' => 'Token login berhasil dibuat dan berlaku selama 5 menit.',
        ]);
    }

    public function verifyToken(Request $request): JsonResponse
    {
        $request->merge([
            'login_token' => trim((string) $request->input('login_token')),
        ]);

        $validated = $request->validate([
            'challenge_id' => ['required', 'integer', 'min:1', 'exists:admins,id'],
            'challenge_token' => ['required', 'string', 'min:40', 'max:255'],
            'login_token' => ['required', 'string', 'regex:/^\d{6}$/'],
        ]);

        $admin = $this->resolveChallengeAdmin((int) $validated['challenge_id'], $validated['challenge_token']);

        if (! $admin) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi login tidak valid atau sudah kadaluarsa. Silakan login ulang.',
            ], 400);
        }

        if (empty($admin->login_token_hash) || empty($admin->login_token_expires_at)) {
            return response()->json([
                'success' => false,
                'message' => 'Token login belum dibuat. Silakan generate token terlebih dahulu.',
            ], 400);
        }

        if (Carbon::now()->greaterThan($admin->login_token_expires_at)) {
            $admin->forceFill([
                'login_token_hash' => null,
                'login_token_expires_at' => null,
            ])->save();

            return response()->json([
                'success' => false,
                'message' => 'Token login sudah kadaluarsa. Silakan generate token baru atau login ulang.',
            ], 400);
        }

        if (! Hash::check($validated['login_token'], $admin->login_token_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Token login salah.',
            ], 401);
        }

        $admin->forceFill([
            'login_challenge_hash' => null,
            'login_challenge_expires_at' => null,
            'login_token_hash' => null,
            'login_token_expires_at' => null,
        ])->save();

        $token = $admin->createToken('admin-token')->plainTextToken;

        ActivityLog::log('token_verified', "Verified login token for {$admin->username}", $admin->id, $request->ip());

        return response()->json([
            'success' => true,
            'token' => $token,
            'username' => $admin->username,
            'role' => $admin->role,
            'message' => 'Token berhasil diverifikasi.',
        ]);
    }

    private function resolveChallengeAdmin(int $challengeId, string $challengeToken): ?Admin
    {
        $admin = Admin::find($challengeId);

        if (! $admin || empty($admin->login_challenge_hash) || empty($admin->login_challenge_expires_at)) {
            return null;
        }

        if (Carbon::now()->greaterThan($admin->login_challenge_expires_at)) {
            $admin->forceFill([
                'login_challenge_hash' => null,
                'login_challenge_expires_at' => null,
                'login_token_hash' => null,
                'login_token_expires_at' => null,
            ])->save();

            return null;
        }

        if (! Hash::check($challengeToken, $admin->login_challenge_hash)) {
            return null;
        }

        return $admin;
    }

    private function normalizeFullName(string $value): string
    {
        return Str::lower((string) preg_replace('/\s+/', ' ', trim($value)));
    }
}
