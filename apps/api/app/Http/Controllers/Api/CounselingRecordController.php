<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Admin;
use App\Models\CounselingRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CounselingRecordController extends Controller
{
    private const SERVICE_TYPES = ['individu', 'kelompok', 'konsultasi', 'mediasi', 'home_visit', 'case_conference'];

    private const MEDIA_TYPES = ['tatap_muka', 'telepon', 'chat', 'hybrid', 'rujukan'];

    private const STATUSES = ['selesai', 'belum_selesai'];

    public function index(Request $request): JsonResponse
    {
        $admin = $this->requireGuruBk($request);
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $records = CounselingRecord::query()
            ->with(['student:id,nis,name,class_name', 'creator:id,username,full_name'])
            ->orderByDesc('session_date')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (CounselingRecord $record) => $this->mapRecord($record));

        return response()->json($records);
    }

    public function store(Request $request): JsonResponse
    {
        $admin = $this->requireGuruBk($request);
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $validated = $this->validatePayload($request, false);

        $record = CounselingRecord::create([
            ...$validated,
            'created_by_admin_id' => $admin->id,
        ]);

        ActivityLog::log(
            'counseling_record_create',
            "Created counseling record for student ID {$record->allowed_nis_id}",
            $admin->id,
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'record' => $this->mapRecord($record->load(['student:id,nis,name,class_name', 'creator:id,username,full_name'])),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $admin = $this->requireGuruBk($request);
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $record = CounselingRecord::findOrFail($id);
        $validated = $this->validatePayload($request, true);

        $record->fill($validated);
        $record->save();

        ActivityLog::log(
            'counseling_record_update',
            "Updated counseling record {$record->id}",
            $admin->id,
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'record' => $this->mapRecord($record->load(['student:id,nis,name,class_name', 'creator:id,username,full_name'])),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $admin = $this->requireGuruBk($request);
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $record = CounselingRecord::findOrFail($id);
        $recordId = $record->id;
        $record->delete();

        ActivityLog::log(
            'counseling_record_delete',
            "Deleted counseling record {$recordId}",
            $admin->id,
            $request->ip()
        );

        return response()->json(['success' => true]);
    }

    private function validatePayload(Request $request, bool $isUpdate): array
    {
        foreach ([
            'service_type',
            'medium',
            'location',
            'topic',
            'objective',
            'assessment',
            'intervention',
            'result_summary',
            'follow_up_plan',
            'status',
        ] as $field) {
            if ($request->has($field)) {
                $request->merge([$field => trim((string) $request->input($field))]);
            }
        }

        $prefix = $isUpdate ? 'sometimes' : 'required';

        return $request->validate([
            'allowed_nis_id' => [$prefix, 'integer', 'exists:allowed_nis,id'],
            'session_date' => [$prefix, 'date'],
            'start_time' => [$isUpdate ? 'sometimes' : 'nullable', 'nullable', 'date_format:H:i'],
            'end_time' => [$isUpdate ? 'sometimes' : 'nullable', 'nullable', 'date_format:H:i'],
            'service_type' => [$prefix, Rule::in(self::SERVICE_TYPES)],
            'medium' => [$prefix, Rule::in(self::MEDIA_TYPES)],
            'location' => [$isUpdate ? 'sometimes' : 'nullable', 'nullable', 'string', 'max:150'],
            'topic' => [$prefix, 'string', 'min:3', 'max:180'],
            'objective' => [$prefix, 'string', 'min:10', 'max:4000'],
            'assessment' => [$isUpdate ? 'sometimes' : 'nullable', 'nullable', 'string', 'max:4000'],
            'intervention' => [$prefix, 'string', 'min:10', 'max:4000'],
            'result_summary' => [$isUpdate ? 'sometimes' : 'nullable', 'nullable', 'string', 'max:4000'],
            'follow_up_plan' => [$isUpdate ? 'sometimes' : 'nullable', 'nullable', 'string', 'max:4000'],
            'status' => [$prefix, Rule::in(self::STATUSES)],
            'next_follow_up_date' => [$isUpdate ? 'sometimes' : 'nullable', 'nullable', 'date'],
        ]);
    }

    private function mapRecord(CounselingRecord $record): array
    {
        return [
            'id' => $record->id,
            'studentId' => $record->allowed_nis_id,
            'studentNis' => $record->student?->nis,
            'studentName' => $record->student?->name,
            'studentClass' => $record->student?->class_name,
            'sessionDate' => $record->session_date?->format('Y-m-d'),
            'startTime' => $record->start_time,
            'endTime' => $record->end_time,
            'serviceType' => $record->service_type,
            'medium' => $record->medium,
            'location' => $record->location,
            'topic' => $record->topic,
            'objective' => $record->objective,
            'assessment' => $record->assessment,
            'intervention' => $record->intervention,
            'resultSummary' => $record->result_summary,
            'followUpPlan' => $record->follow_up_plan,
            'status' => $record->status,
            'nextFollowUpDate' => $record->next_follow_up_date?->format('Y-m-d'),
            'creatorName' => $record->creator?->full_name ?: $record->creator?->username,
            'createdAt' => $record->created_at?->toISOString(),
            'updatedAt' => $record->updated_at?->toISOString(),
        ];
    }

    private function requireGuruBk(Request $request): Admin|JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof Admin || ! $user->isGuruBK()) {
            return response()->json(['message' => 'Unauthorized. Guru BK only.'], 403);
        }

        return $user;
    }
}
