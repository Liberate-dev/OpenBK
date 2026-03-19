<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Admin;
use App\Models\RecognizedReporter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RecognizedReporterController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $currentAdmin = $this->requireAdmin($request);
        if ($currentAdmin instanceof JsonResponse) {
            return $currentAdmin;
        }

        $reporters = RecognizedReporter::query()
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (RecognizedReporter $reporter) => [
                'id' => $reporter->id,
                'nip' => $reporter->nip,
                'aliasName' => $reporter->alias_name,
                'description' => $reporter->description,
                'isActive' => $reporter->is_active,
                'createdAt' => $reporter->created_at?->toISOString(),
                'updatedAt' => $reporter->updated_at?->toISOString(),
            ]);

        return response()->json($reporters);
    }

    public function store(Request $request): JsonResponse
    {
        $currentAdmin = $this->requireAdmin($request);
        if ($currentAdmin instanceof JsonResponse) {
            return $currentAdmin;
        }

        $request->merge([
            'nip' => trim((string) $request->input('nip')),
            'alias_name' => trim((string) $request->input('alias_name')),
            'description' => $request->has('description')
                ? trim((string) $request->input('description'))
                : null,
        ]);

        $validated = $request->validate([
            'nip' => ['required', 'string', 'regex:/^\d{5,30}$/', 'unique:recognized_reporters,nip'],
            'alias_name' => ['required', 'string', 'min:3', 'max:120'],
            'description' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $reporter = RecognizedReporter::create([
            'nip' => $validated['nip'],
            'alias_name' => $validated['alias_name'],
            'description' => $validated['description'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        ActivityLog::log(
            'recognized_reporter_create',
            "Created recognized reporter {$reporter->nip}",
            $currentAdmin->id,
            $request->ip()
        );

        return response()->json(['success' => true], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $currentAdmin = $this->requireAdmin($request);
        if ($currentAdmin instanceof JsonResponse) {
            return $currentAdmin;
        }

        $reporter = RecognizedReporter::findOrFail($id);

        $normalizedInput = [];

        foreach (['nip', 'alias_name', 'description'] as $field) {
            if (! $request->has($field)) {
                continue;
            }

            $normalizedInput[$field] = trim((string) $request->input($field));
        }

        if ($normalizedInput !== []) {
            $request->merge($normalizedInput);
        }

        $validated = $request->validate([
            'nip' => ['sometimes', 'filled', 'string', 'regex:/^\d{5,30}$/', Rule::unique('recognized_reporters', 'nip')->ignore($id)],
            'alias_name' => ['sometimes', 'filled', 'string', 'min:3', 'max:120'],
            'description' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('nip', $validated)) {
            $reporter->nip = $validated['nip'];
        }
        if (array_key_exists('alias_name', $validated)) {
            $reporter->alias_name = $validated['alias_name'];
        }
        if (array_key_exists('description', $validated)) {
            $reporter->description = $validated['description'] ?: null;
        }
        if (array_key_exists('is_active', $validated)) {
            $reporter->is_active = (bool) $validated['is_active'];
        }

        $reporter->save();

        ActivityLog::log(
            'recognized_reporter_update',
            "Updated recognized reporter {$reporter->nip}",
            $currentAdmin->id,
            $request->ip()
        );

        return response()->json(['success' => true]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $currentAdmin = $this->requireAdmin($request);
        if ($currentAdmin instanceof JsonResponse) {
            return $currentAdmin;
        }

        $reporter = RecognizedReporter::findOrFail($id);
        $nip = $reporter->nip;
        $reporter->delete();

        ActivityLog::log(
            'recognized_reporter_delete',
            "Deleted recognized reporter {$nip}",
            $currentAdmin->id,
            $request->ip()
        );

        return response()->json(['success' => true]);
    }

    private function requireAdmin(Request $request): Admin|JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof Admin || ! $user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        return $user;
    }
}
