<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Admin;
use App\Models\AllowedNis;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentProfileController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $currentAdmin = $this->requireAdmin($request);
        if ($currentAdmin instanceof JsonResponse) {
            return $currentAdmin;
        }

        $students = Student::query()
            ->withCount('messages')
            ->withMax('messages', 'created_at')
            ->get()
            ->keyBy('nis');

        $profiles = AllowedNis::query()
            ->orderBy('name')
            ->orderBy('nis')
            ->get()
            ->map(function (AllowedNis $entry) use ($students) {
                /** @var Student|null $student */
                $student = $students->get($entry->nis);

                return [
                    'id' => $entry->id,
                    'nis' => $entry->nis,
                    'name' => $entry->name,
                    'className' => $entry->class_name,
                    'profileSummary' => $entry->profile_summary,
                    'characterNotes' => $entry->character_notes,
                    'accountStatus' => $student === null
                        ? 'not_registered'
                        : ($student->password_reset_required ? 'reset_required' : 'active'),
                    'messagesCount' => $student?->messages_count ?? 0,
                    'lastMessageAt' => $student?->messages_max_created_at
                        ? \Illuminate\Support\Carbon::parse($student->messages_max_created_at)->toISOString()
                        : null,
                    'createdAt' => $entry->created_at?->toISOString(),
                    'updatedAt' => $entry->updated_at?->toISOString(),
                ];
            });

        return response()->json($profiles);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $currentAdmin = $this->requireAdmin($request);
        if ($currentAdmin instanceof JsonResponse) {
            return $currentAdmin;
        }

        $entry = AllowedNis::findOrFail($id);

        $normalizedInput = [];

        foreach (['name', 'class_name', 'profile_summary', 'character_notes'] as $field) {
            if (! $request->has($field)) {
                continue;
            }

            $normalizedInput[$field] = trim((string) $request->input($field));
        }

        if ($normalizedInput !== []) {
            $request->merge($normalizedInput);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'class_name' => ['sometimes', 'nullable', 'string', 'max:50'],
            'profile_summary' => ['sometimes', 'nullable', 'string', 'max:255'],
            'character_notes' => ['sometimes', 'nullable', 'string', 'max:4000'],
        ]);

        if (array_key_exists('name', $validated)) {
            $entry->name = $validated['name'] ?: null;
        }
        if (array_key_exists('class_name', $validated)) {
            $entry->class_name = $validated['class_name'] ?: null;
        }
        if (array_key_exists('profile_summary', $validated)) {
            $entry->profile_summary = $validated['profile_summary'] ?: null;
        }
        if (array_key_exists('character_notes', $validated)) {
            $entry->character_notes = $validated['character_notes'] ?: null;
        }

        $entry->save();

        ActivityLog::log('student_profile_update', "Updated student profile {$entry->nis}", $currentAdmin->id, $request->ip());

        return response()->json(['success' => true]);
    }

    private function requireAdmin(Request $request): Admin|JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof Admin || ! $user->isGuruBK()) {
            return response()->json(['message' => 'Unauthorized. Guru BK only.'], 403);
        }

        return $user;
    }
}
