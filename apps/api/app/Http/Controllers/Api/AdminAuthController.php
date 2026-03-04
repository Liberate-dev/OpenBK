<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\AdminOtpMail;
use App\Models\ActivityLog;
use App\Models\Admin;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

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

        // If admin has an email configured, enforce 2FA.
        if (! empty($admin->email)) {
            $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $admin->otp_code = Hash::make($otp);
            $admin->otp_expires_at = Carbon::now()->addMinutes(5);
            $admin->save();

            try {
                Mail::to($admin->email)->send(new AdminOtpMail($otp));
                $sent = true;
            } catch (\Exception $e) {
                $sent = false;
                Log::error('Mail error: '.$e->getMessage());
            }

            ActivityLog::log('otp_sent', "OTP sent to {$admin->username}", $admin->id, $request->ip());

            return response()->json([
                'success' => true,
                'requires_2fa' => true,
                'otp_id' => $admin->id,
                'message' => $sent
                    ? 'Kode OTP telah dikirim ke Email Anda.'
                    : 'Gagal mengirim OTP ke Email. Silakan coba lagi.',
            ]);
        }

        // No 2FA configured, issue token immediately.
        $token = $admin->createToken('admin-token')->plainTextToken;

        ActivityLog::log('login', "{$admin->username} logged in (no 2FA)", $admin->id, $request->ip());

        return response()->json([
            'success' => true,
            'token' => $token,
            'username' => $admin->username,
            'role' => $admin->role,
            'message' => 'Login berhasil.',
        ]);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $request->merge([
            'otp_code' => trim((string) $request->input('otp_code')),
        ]);

        $validated = $request->validate([
            'otp_id' => ['required', 'integer', 'min:1', 'exists:admins,id'],
            'otp_code' => ['required', 'string', 'regex:/^\d{6}$/'],
        ]);

        $admin = Admin::find($validated['otp_id']);

        if (! $admin || empty($admin->otp_code)) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi OTP tidak valid.',
            ], 400);
        }

        if (Carbon::now()->greaterThan($admin->otp_expires_at)) {
            $admin->otp_code = null;
            $admin->otp_expires_at = null;
            $admin->save();

            return response()->json([
                'success' => false,
                'message' => 'Kode OTP sudah kadaluarsa. Silakan login ulang.',
            ], 400);
        }

        if (! Hash::check($validated['otp_code'], $admin->otp_code)) {
            return response()->json([
                'success' => false,
                'message' => 'Kode OTP salah.',
            ], 401);
        }

        // Clear OTP.
        $admin->otp_code = null;
        $admin->otp_expires_at = null;
        $admin->save();

        $token = $admin->createToken('admin-token')->plainTextToken;

        ActivityLog::log('login', "{$admin->username} logged in (2FA verified)", $admin->id, $request->ip());

        return response()->json([
            'success' => true,
            'token' => $token,
            'username' => $admin->username,
            'role' => $admin->role,
            'message' => 'Verifikasi berhasil.',
        ]);
    }
}
