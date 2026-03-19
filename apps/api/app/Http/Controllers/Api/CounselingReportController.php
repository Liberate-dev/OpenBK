<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\CounselingRecord;
use App\Models\Message;
use App\Models\PublicReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CounselingReportController extends Controller
{
    public function dashboardSummary(Request $request): JsonResponse
    {
        $admin = $this->requireReportViewer($request);
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $now = Carbon::now();
        $monthStart = $now->copy()->startOfMonth();
        $monthEnd = $now->copy()->endOfMonth();

        $incomingReports = Message::count() + PublicReport::count();
        $urgentReports = Message::whereIn('risk_level', ['high', 'critical'])->count()
            + PublicReport::whereIn('risk_level', ['high', 'critical'])->count();

        $counselingThisMonth = CounselingRecord::whereBetween('session_date', [$monthStart->toDateString(), $monthEnd->toDateString()])->count();
        $counselingTotal = CounselingRecord::count();
        $counselingCompleted = CounselingRecord::where('status', 'selesai')->count();
        $counselingOpen = CounselingRecord::where('status', 'belum_selesai')->count();
        $studentsHandled = CounselingRecord::distinct('allowed_nis_id')->count('allowed_nis_id');

        return response()->json([
            'incomingReports' => $incomingReports,
            'urgentReports' => $urgentReports,
            'counselingThisMonth' => $counselingThisMonth,
            'counselingTotal' => $counselingTotal,
            'counselingCompleted' => $counselingCompleted,
            'counselingOpen' => $counselingOpen,
            'studentsHandled' => $studentsHandled,
            'viewerRole' => $admin->role,
        ]);
    }

    public function summary(Request $request): JsonResponse
    {
        $admin = $this->requireReportViewer($request);
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        [$type, $validated] = $this->validateReportRequest($request);
        $summary = $this->buildSummary($type, $validated);

        return response()->json($summary);
    }

    public function export(Request $request): Response|JsonResponse
    {
        $admin = $this->requireReportViewer($request);
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        [$type, $validated] = $this->validateReportRequest($request);

        $format = $request->validate([
            'format' => ['required', Rule::in(['word', 'excel'])],
        ])['format'];

        $summary = $this->buildSummary($type, $validated);
        $filenameBase = "laporan-{$type}-".Str::slug($summary['label'], '-');

        if ($format === 'word') {
            $content = $this->buildWordDocument($summary);

            return response($content, 200, [
                'Content-Type' => 'application/msword; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$filenameBase}.doc\"",
            ]);
        }

        $content = $this->buildExcelDocument($summary);

        return response($content, 200, [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filenameBase}.xls\"",
        ]);
    }

    private function validateReportRequest(Request $request): array
    {
        $type = $request->validate([
            'type' => ['required', Rule::in(['weekly', 'monthly', 'semester', 'yearly'])],
        ])['type'];

        $validated = $request->validate([
            'week_start' => ['nullable', 'date'],
            'month' => ['nullable', 'integer', 'min:1', 'max:12'],
            'semester' => ['nullable', 'integer', Rule::in([1, 2])],
            'year' => ['nullable', 'integer', 'min:2020', 'max:2100'],
        ]);

        return [$type, $validated];
    }

    private function buildSummary(string $type, array $input): array
    {
        [$start, $end, $label] = $this->resolvePeriod($type, $input);

        $records = CounselingRecord::query()
            ->with(['student:id,nis,name,class_name', 'creator:id,username,full_name'])
            ->whereBetween('session_date', [$start->toDateString(), $end->toDateString()])
            ->orderBy('session_date')
            ->orderBy('start_time')
            ->get();

        $items = $records->map(fn (CounselingRecord $record) => [
            'date' => $record->session_date?->format('Y-m-d'),
            'studentNis' => $record->student?->nis,
            'studentName' => $record->student?->name,
            'studentClass' => $record->student?->class_name,
            'serviceType' => $record->service_type,
            'medium' => $record->medium,
            'topic' => $record->topic,
            'status' => $record->status,
            'resultSummary' => $record->result_summary,
            'followUpPlan' => $record->follow_up_plan,
            'creatorName' => $record->creator?->full_name ?: $record->creator?->username,
        ])->values();

        $total = $records->count();
        $completed = $records->where('status', 'selesai')->count();
        $unfinished = $records->where('status', 'belum_selesai')->count();
        $studentsHandled = $records->pluck('allowed_nis_id')->unique()->count();

        $activities = $this->buildActivities($records);
        $serviceBreakdown = $records->groupBy('service_type')
            ->map(fn (Collection $group, string $serviceType) => [
                'serviceType' => $serviceType,
                'total' => $group->count(),
            ])
            ->values();

        $monthlyBreakdown = $records->groupBy(fn (CounselingRecord $record) => $record->session_date?->format('Y-m'))
            ->map(fn (Collection $group, string $period) => [
                'period' => $period,
                'total' => $group->count(),
                'completed' => $group->where('status', 'selesai')->count(),
                'unfinished' => $group->where('status', 'belum_selesai')->count(),
            ])
            ->values();

        return [
            'type' => $type,
            'label' => $label,
            'range' => [
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
            ],
            'stats' => [
                'totalCounseling' => $total,
                'completed' => $completed,
                'unfinished' => $unfinished,
                'studentsHandled' => $studentsHandled,
            ],
            'activities' => $activities,
            'serviceBreakdown' => $serviceBreakdown,
            'monthlyBreakdown' => $monthlyBreakdown,
            'items' => $items,
        ];
    }

    private function buildActivities(Collection $records): array
    {
        return $records->groupBy(fn (CounselingRecord $record) => $record->session_date?->format('Y-m-d'))
            ->map(function (Collection $group, string $date) {
                $topics = $group->map(function (CounselingRecord $record) {
                    $studentName = $record->student?->name ?: $record->student?->nis;
                    return trim("{$record->service_type} - {$studentName} - {$record->topic}");
                })->values();

                return [
                    'date' => $date,
                    'count' => $group->count(),
                    'details' => $topics,
                ];
            })
            ->values()
            ->all();
    }

    private function resolvePeriod(string $type, array $input): array
    {
        $now = Carbon::now();
        $year = isset($input['year']) ? (int) $input['year'] : (int) $now->year;

        return match ($type) {
            'weekly' => $this->resolveWeeklyPeriod($input['week_start'] ?? $now->copy()->startOfWeek()->toDateString()),
            'monthly' => $this->resolveMonthlyPeriod($year, (int) ($input['month'] ?? $now->month)),
            'semester' => $this->resolveSemesterPeriod($year, (int) ($input['semester'] ?? ($now->month <= 6 ? 1 : 2))),
            'yearly' => $this->resolveYearlyPeriod($year),
        };
    }

    private function resolveWeeklyPeriod(string $weekStart): array
    {
        $start = Carbon::parse($weekStart)->startOfDay();
        $end = $start->copy()->addDays(6)->endOfDay();

        return [$start, $end, 'Minggu '.$start->translatedFormat('d M Y').' - '.$end->translatedFormat('d M Y')];
    }

    private function resolveMonthlyPeriod(int $year, int $month): array
    {
        $start = Carbon::create($year, $month, 1)->startOfMonth();
        $end = $start->copy()->endOfMonth();

        return [$start, $end, 'Bulan '.$start->translatedFormat('F Y')];
    }

    private function resolveSemesterPeriod(int $year, int $semester): array
    {
        $startMonth = $semester === 1 ? 1 : 7;
        $start = Carbon::create($year, $startMonth, 1)->startOfMonth();
        $end = $start->copy()->addMonths(5)->endOfMonth();

        return [$start, $end, "Semester {$semester} {$year}"];
    }

    private function resolveYearlyPeriod(int $year): array
    {
        $start = Carbon::create($year, 1, 1)->startOfYear();
        $end = $start->copy()->endOfYear();

        return [$start, $end, "Tahun {$year}"];
    }

    private function buildWordDocument(array $summary): string
    {
        $rows = collect($summary['items'])->map(function (array $item) {
            return '<tr>'
                .'<td>'.e($item['date']).'</td>'
                .'<td>'.e($item['studentNis']).'</td>'
                .'<td>'.e($item['studentName']).'</td>'
                .'<td>'.e($item['serviceType']).'</td>'
                .'<td>'.e($item['topic']).'</td>'
                .'<td>'.e($item['status']).'</td>'
                .'</tr>';
        })->implode('');

        $activityBlocks = collect($summary['activities'])->map(function (array $activity) {
            $details = collect($activity['details'])->map(fn (string $detail) => '<li>'.e($detail).'</li>')->implode('');
            return '<h4>'.e($activity['date']).' ('.$activity['count'].' kegiatan)</h4><ul>'.$details.'</ul>';
        })->implode('');

        return '<html><head><meta charset="UTF-8"><style>'
            .'body{font-family:Calibri,Arial,sans-serif;font-size:12pt;color:#0f172a;}'
            .'table{border-collapse:collapse;width:100%;margin-top:12px;}'
            .'th,td{border:1px solid #cbd5e1;padding:8px;text-align:left;vertical-align:top;}'
            .'h1,h2,h3,h4{margin:0 0 10px 0;}'
            .'p{margin:0 0 8px 0;}'
            .'</style></head><body>'
            .'<h1>Laporan BK '.e($summary['label']).'</h1>'
            .'<p>Total konseling: <strong>'.$summary['stats']['totalCounseling'].'</strong></p>'
            .'<p>Selesai: <strong>'.$summary['stats']['completed'].'</strong> | Belum selesai: <strong>'.$summary['stats']['unfinished'].'</strong> | Siswa ditangani: <strong>'.$summary['stats']['studentsHandled'].'</strong></p>'
            .'<h3>Ringkasan Kegiatan</h3>'
            .$activityBlocks
            .'<h3>Daftar Konseling</h3>'
            .'<table><thead><tr><th>Tanggal</th><th>NIS</th><th>Nama</th><th>Layanan</th><th>Topik</th><th>Status</th></tr></thead><tbody>'.$rows.'</tbody></table>'
            .'</body></html>';
    }

    private function buildExcelDocument(array $summary): string
    {
        $rows = collect($summary['items'])->map(function (array $item) {
            return '<tr>'
                .'<td>'.e($item['date']).'</td>'
                .'<td>'.e($item['studentNis']).'</td>'
                .'<td>'.e($item['studentName']).'</td>'
                .'<td>'.e($item['studentClass']).'</td>'
                .'<td>'.e($item['serviceType']).'</td>'
                .'<td>'.e($item['medium']).'</td>'
                .'<td>'.e($item['topic']).'</td>'
                .'<td>'.e($item['status']).'</td>'
                .'<td>'.e($item['resultSummary']).'</td>'
                .'<td>'.e($item['followUpPlan']).'</td>'
                .'</tr>';
        })->implode('');

        return '<html><head><meta charset="UTF-8"></head><body>'
            .'<table border="1">'
            .'<tr><th colspan="10">Laporan BK '.e($summary['label']).'</th></tr>'
            .'<tr><td>Total Konseling</td><td>'.$summary['stats']['totalCounseling'].'</td><td>Selesai</td><td>'.$summary['stats']['completed'].'</td><td>Belum Selesai</td><td>'.$summary['stats']['unfinished'].'</td><td>Siswa Ditangani</td><td>'.$summary['stats']['studentsHandled'].'</td><td></td><td></td></tr>'
            .'<tr><th>Tanggal</th><th>NIS</th><th>Nama</th><th>Kelas</th><th>Layanan</th><th>Media</th><th>Topik</th><th>Status</th><th>Hasil</th><th>Rencana Tindak Lanjut</th></tr>'
            .$rows
            .'</table>'
            .'</body></html>';
    }

    private function requireReportViewer(Request $request): Admin|JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof Admin || ! $user->canAccessReports()) {
            return response()->json(['message' => 'Unauthorized. Report viewer only.'], 403);
        }

        return $user;
    }
}
