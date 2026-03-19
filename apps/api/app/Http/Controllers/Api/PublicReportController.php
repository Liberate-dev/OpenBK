<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\PublicReport;
use App\Models\PublicReportSession;
use App\Services\RiskScoringService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PublicReportController extends Controller
{
    public function store(Request $request, RiskScoringService $riskService): JsonResponse
    {
        $session = $this->resolveSession($request);
        if ($session instanceof JsonResponse) {
            return $session;
        }

        $request->merge([
            'student_name' => trim((string) $request->input('student_name')),
            'student_class' => $request->has('student_class')
                ? trim((string) $request->input('student_class'))
                : null,
            'student_nis' => $request->has('student_nis')
                ? trim((string) $request->input('student_nis'))
                : null,
            'summary' => trim((string) $request->input('summary')),
            'message' => trim((string) $request->input('message')),
        ]);

        $validated = $request->validate([
            'student_name' => ['required', 'string', 'min:3', 'max:120'],
            'student_class' => ['nullable', 'string', 'max:50'],
            'student_nis' => ['nullable', 'string', 'regex:/^\d{4,30}$/'],
            'summary' => ['required', 'string', 'min:5', 'max:150'],
            'message' => ['required', 'string', 'min:20', 'max:3000'],
        ]);

        $riskResult = $riskService->analyze($validated['summary'].' '.$validated['message']);
        $reporter = $session->reporter;

        $report = PublicReport::create([
            'reference_id' => 'rpt-'.time().'-'.random_int(100, 999),
            'recognized_reporter_id' => $reporter->id,
            'reporter_nip' => $reporter->nip,
            'reporter_alias' => $reporter->alias_name,
            'student_name' => $validated['student_name'],
            'student_class' => $validated['student_class'] ?: null,
            'student_nis' => $validated['student_nis'] ?: null,
            'summary' => $validated['summary'],
            'body' => $validated['message'],
            'risk_level' => $riskResult['risk_level'],
            'risk_score' => $riskResult['risk_score'],
            'risk_tags' => $riskResult['risk_tags'],
        ]);

        $session->delete();

        ActivityLog::log(
            'public_report_submit',
            "Public report {$report->reference_id} submitted by {$reporter->nip}",
            null,
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'referenceId' => $report->reference_id,
            'message' => 'Laporan berhasil dikirim.',
        ], 201);
    }

    private function resolveSession(Request $request): PublicReportSession|JsonResponse
    {
        $sessionToken = trim((string) $request->header('X-Report-Session', ''));

        if ($sessionToken === '') {
            return response()->json([
                'message' => 'Session pelapor tidak ditemukan. Silakan verifikasi token terlebih dahulu.',
            ], 401);
        }

        $sessions = PublicReportSession::with('reporter')->get();
        /** @var PublicReportSession|null $session */
        $session = $sessions->first(fn (PublicReportSession $candidate) => Hash::check($sessionToken, $candidate->session_token_hash));

        if (! $session || ! $session->reporter || ! $session->reporter->is_active) {
            return response()->json([
                'message' => 'Session pelapor tidak valid.',
            ], 401);
        }

        if ($session->consumed_at !== null || Carbon::now()->greaterThan($session->expires_at)) {
            $session->delete();

            return response()->json([
                'message' => 'Session pelapor sudah habis. Silakan generate token baru.',
            ], 401);
        }

        return $session;
    }
}
