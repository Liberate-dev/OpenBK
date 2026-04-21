<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Admin;
use App\Models\PublicReport;
use App\Services\RiskScoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GuruReportController extends Controller
{
    /**
     * Guru submits a report about a student directly (no NIP token flow needed).
     */
    public function store(Request $request, RiskScoringService $riskService): JsonResponse
    {
        $guru = $request->user();
        if (! $guru instanceof Admin || ! $guru->isGuru()) {
            return response()->json(['message' => 'Unauthorized. Guru only.'], 403);
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

        $riskResult = $riskService->analyze($validated['summary'] . ' ' . $validated['message']);

        $report = PublicReport::create([
            'reference_id' => 'guru-' . time() . '-' . random_int(100, 999),
            'recognized_reporter_id' => null,
            'reporter_nip' => $guru->nip,
            'reporter_alias' => $guru->full_name ?? $guru->username,
            'student_name' => $validated['student_name'],
            'student_class' => $validated['student_class'] ?: null,
            'student_nis' => $validated['student_nis'] ?: null,
            'summary' => $validated['summary'],
            'body' => $validated['message'],
            'risk_level' => $riskResult['risk_level'],
            'risk_score' => $riskResult['risk_score'],
            'risk_tags' => $riskResult['risk_tags'],
        ]);

        ActivityLog::log(
            'guru_report_submit',
            "Guru report {$report->reference_id} submitted by {$guru->username}",
            $guru->id,
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'referenceId' => $report->reference_id,
            'message' => 'Laporan berhasil dikirim ke Guru BK.',
        ], 201);
    }
}
