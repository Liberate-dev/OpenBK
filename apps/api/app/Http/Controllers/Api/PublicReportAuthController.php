<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PublicReportSession;
use App\Models\RecognizedReporter;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PublicReportAuthController extends Controller
{
    public function generateToken(Request $request): JsonResponse
    {
        $request->merge([
            'nip' => trim((string) $request->input('nip')),
            'alias_name' => trim((string) $request->input('alias_name')),
        ]);

        $validated = $request->validate([
            'nip' => ['required', 'string', 'regex:/^\d{5,30}$/'],
            'alias_name' => ['required', 'string', 'min:3', 'max:120'],
        ]);

        $reporter = RecognizedReporter::query()
            ->where('nip', $validated['nip'])
            ->where('is_active', true)
            ->first();

        if (! $reporter || $this->normalizeText($reporter->alias_name) !== $this->normalizeText($validated['alias_name'])) {
            return response()->json([
                'success' => false,
                'message' => 'NIP atau alias tidak dikenali.',
            ], 401);
        }

        $challengeToken = Str::random(64);
        $loginToken = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $reporter->forceFill([
            'login_challenge_hash' => Hash::make($challengeToken),
            'login_challenge_expires_at' => Carbon::now()->addMinutes(5),
            'login_token_hash' => Hash::make($loginToken),
            'login_token_expires_at' => Carbon::now()->addMinutes(5),
        ])->save();

        return response()->json([
            'success' => true,
            'challenge_id' => $reporter->id,
            'challenge_token' => $challengeToken,
            'generated_token' => $loginToken,
            'expires_at' => $reporter->login_token_expires_at?->toISOString(),
            'reporter' => [
                'nip' => $reporter->nip,
                'aliasName' => $reporter->alias_name,
                'description' => $reporter->description,
            ],
            'message' => 'Token verifikasi berhasil dibuat dan berlaku selama 5 menit.',
        ]);
    }

    public function verifyToken(Request $request): JsonResponse
    {
        $request->merge([
            'login_token' => trim((string) $request->input('login_token')),
        ]);

        $validated = $request->validate([
            'challenge_id' => ['required', 'integer', 'min:1', 'exists:recognized_reporters,id'],
            'challenge_token' => ['required', 'string', 'min:40', 'max:255'],
            'login_token' => ['required', 'string', 'regex:/^\d{6}$/'],
        ]);

        $reporter = $this->resolveChallengeReporter((int) $validated['challenge_id'], $validated['challenge_token']);

        if (! $reporter) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi verifikasi tidak valid atau sudah kadaluarsa.',
            ], 400);
        }

        if (empty($reporter->login_token_hash) || empty($reporter->login_token_expires_at)) {
            return response()->json([
                'success' => false,
                'message' => 'Token belum dibuat. Silakan generate token terlebih dahulu.',
            ], 400);
        }

        if (Carbon::now()->greaterThan($reporter->login_token_expires_at)) {
            $reporter->forceFill([
                'login_token_hash' => null,
                'login_token_expires_at' => null,
            ])->save();

            return response()->json([
                'success' => false,
                'message' => 'Token sudah kadaluarsa. Silakan generate token baru.',
            ], 400);
        }

        if (! Hash::check($validated['login_token'], $reporter->login_token_hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Token verifikasi salah.',
            ], 401);
        }

        $plainSessionToken = Str::random(80);

        PublicReportSession::where('recognized_reporter_id', $reporter->id)->delete();

        PublicReportSession::create([
            'recognized_reporter_id' => $reporter->id,
            'session_token_hash' => Hash::make($plainSessionToken),
            'expires_at' => Carbon::now()->addMinutes(30),
        ]);

        $reporter->forceFill([
            'login_challenge_hash' => null,
            'login_challenge_expires_at' => null,
            'login_token_hash' => null,
            'login_token_expires_at' => null,
        ])->save();

        return response()->json([
            'success' => true,
            'session_token' => $plainSessionToken,
            'expires_at' => Carbon::now()->addMinutes(30)->toISOString(),
            'reporter' => [
                'nip' => $reporter->nip,
                'aliasName' => $reporter->alias_name,
                'description' => $reporter->description,
            ],
            'message' => 'Token berhasil diverifikasi. Silakan isi form laporan.',
        ]);
    }

    private function resolveChallengeReporter(int $challengeId, string $challengeToken): ?RecognizedReporter
    {
        $reporter = RecognizedReporter::find($challengeId);

        if (! $reporter || ! $reporter->is_active || empty($reporter->login_challenge_hash) || empty($reporter->login_challenge_expires_at)) {
            return null;
        }

        if (Carbon::now()->greaterThan($reporter->login_challenge_expires_at)) {
            $reporter->forceFill([
                'login_challenge_hash' => null,
                'login_challenge_expires_at' => null,
                'login_token_hash' => null,
                'login_token_expires_at' => null,
            ])->save();

            return null;
        }

        if (! Hash::check($challengeToken, $reporter->login_challenge_hash)) {
            return null;
        }

        return $reporter;
    }

    private function normalizeText(string $value): string
    {
        return Str::lower((string) preg_replace('/\s+/', ' ', trim($value)));
    }
}
