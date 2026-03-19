<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Admin;
use App\Models\RepositoryItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RepositoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $currentAdmin = $this->requireAdmin($request);
        if ($currentAdmin instanceof JsonResponse) {
            return $currentAdmin;
        }

        $items = RepositoryItem::with('creator:id,username')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (RepositoryItem $item) => [
                'id' => $item->id,
                'title' => $item->title,
                'category' => $item->category,
                'summary' => $item->summary,
                'content' => $item->content,
                'linkUrl' => $item->link_url,
                'createdBy' => $item->creator?->username ?? 'System',
                'createdAt' => $item->created_at?->toISOString(),
                'updatedAt' => $item->updated_at?->toISOString(),
            ]);

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $currentAdmin = $this->requireAdmin($request);
        if ($currentAdmin instanceof JsonResponse) {
            return $currentAdmin;
        }

        $request->merge([
            'title' => trim((string) $request->input('title')),
            'summary' => trim((string) $request->input('summary')),
            'content' => trim((string) $request->input('content')),
            'link_url' => $request->has('link_url')
                ? trim((string) $request->input('link_url'))
                : null,
        ]);

        $validated = $request->validate([
            'title' => ['required', 'string', 'min:3', 'max:150'],
            'category' => ['required', Rule::in(['repository'])],
            'summary' => ['required', 'string', 'min:10', 'max:255'],
            'content' => ['required', 'string', 'min:10'],
            'link_url' => ['nullable', 'url:http,https', 'max:255'],
        ]);

        $item = RepositoryItem::create([
            ...$validated,
            'created_by_admin_id' => $currentAdmin->id,
        ]);

        ActivityLog::log('repository_create', "Created repository item {$item->title}", $currentAdmin->id, $request->ip());

        return response()->json(['success' => true], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $currentAdmin = $this->requireAdmin($request);
        if ($currentAdmin instanceof JsonResponse) {
            return $currentAdmin;
        }

        $item = RepositoryItem::findOrFail($id);

        $normalizedInput = [];

        foreach (['title', 'summary', 'content', 'link_url', 'category'] as $field) {
            if (! $request->has($field)) {
                continue;
            }

            $normalizedInput[$field] = $field === 'link_url'
                ? trim((string) $request->input($field))
                : trim((string) $request->input($field));
        }

        if ($normalizedInput !== []) {
            $request->merge($normalizedInput);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'filled', 'string', 'min:3', 'max:150'],
            'category' => ['sometimes', Rule::in(['repository'])],
            'summary' => ['sometimes', 'filled', 'string', 'min:10', 'max:255'],
            'content' => ['sometimes', 'filled', 'string', 'min:10'],
            'link_url' => ['sometimes', 'nullable', 'url:http,https', 'max:255'],
        ]);

        if (array_key_exists('title', $validated)) {
            $item->title = $validated['title'];
        }
        if (array_key_exists('category', $validated)) {
            $item->category = $validated['category'];
        }
        if (array_key_exists('summary', $validated)) {
            $item->summary = $validated['summary'];
        }
        if (array_key_exists('content', $validated)) {
            $item->content = $validated['content'];
        }
        if (array_key_exists('link_url', $validated)) {
            $item->link_url = $validated['link_url'] ?: null;
        }

        $item->save();

        ActivityLog::log('repository_update', "Updated repository item {$item->title}", $currentAdmin->id, $request->ip());

        return response()->json(['success' => true]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $currentAdmin = $this->requireAdmin($request);
        if ($currentAdmin instanceof JsonResponse) {
            return $currentAdmin;
        }

        $item = RepositoryItem::findOrFail($id);
        $title = $item->title;
        $item->delete();

        ActivityLog::log('repository_delete', "Deleted repository item {$title}", $currentAdmin->id, $request->ip());

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
