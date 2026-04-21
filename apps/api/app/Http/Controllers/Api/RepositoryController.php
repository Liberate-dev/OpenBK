<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Admin;
use App\Models\RepositoryItem;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RepositoryController extends Controller
{
    /**
     * Admin (guru BK) — list all repository items.
     */
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
                'visibility' => $item->visibility ?? 'private',
                'fileName' => $item->file_original_name,
                'fileSize' => $item->file_size,
                'hasFile' => $item->file_path !== null,
                'createdBy' => $item->creator?->username ?? 'System',
                'createdAt' => $item->created_at?->toISOString(),
                'updatedAt' => $item->updated_at?->toISOString(),
            ]);

        return response()->json($items);
    }

    /**
     * Admin (guru BK) — create a new repository item with optional file upload.
     */
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
            'visibility' => ['sometimes', Rule::in(['private', 'public'])],
            'file' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:10240'], // 10MB max
        ]);

        $filePath = null;
        $fileOriginalName = null;
        $fileSize = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filePath = $file->store('repository', 'local');
            $fileOriginalName = $file->getClientOriginalName();
            $fileSize = $file->getSize();
        }

        $item = RepositoryItem::create([
            'title' => $validated['title'],
            'category' => $validated['category'],
            'summary' => $validated['summary'],
            'content' => $validated['content'],
            'link_url' => $validated['link_url'] ?? null,
            'visibility' => $validated['visibility'] ?? 'private',
            'file_path' => $filePath,
            'file_original_name' => $fileOriginalName,
            'file_size' => $fileSize,
            'created_by_admin_id' => $currentAdmin->id,
        ]);

        ActivityLog::log('repository_create', "Created repository item {$item->title}", $currentAdmin->id, $request->ip());

        return response()->json(['success' => true], 201);
    }

    /**
     * Admin (guru BK) — update a repository item.
     */
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

            $normalizedInput[$field] = trim((string) $request->input($field));
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
            'visibility' => ['sometimes', Rule::in(['private', 'public'])],
            'file' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:10240'],
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
        if (array_key_exists('visibility', $validated)) {
            $item->visibility = $validated['visibility'];
        }

        // Handle file upload replacement
        if ($request->hasFile('file')) {
            // Delete old file if exists
            if ($item->file_path && Storage::disk('local')->exists($item->file_path)) {
                Storage::disk('local')->delete($item->file_path);
            }
            $file = $request->file('file');
            $item->file_path = $file->store('repository', 'local');
            $item->file_original_name = $file->getClientOriginalName();
            $item->file_size = $file->getSize();
        }

        // Handle explicit file removal
        if ($request->input('remove_file') === '1' && $item->file_path) {
            if (Storage::disk('local')->exists($item->file_path)) {
                Storage::disk('local')->delete($item->file_path);
            }
            $item->file_path = null;
            $item->file_original_name = null;
            $item->file_size = null;
        }

        $item->save();

        ActivityLog::log('repository_update', "Updated repository item {$item->title}", $currentAdmin->id, $request->ip());

        return response()->json(['success' => true]);
    }

    /**
     * Admin (guru BK) — delete a repository item.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $currentAdmin = $this->requireAdmin($request);
        if ($currentAdmin instanceof JsonResponse) {
            return $currentAdmin;
        }

        $item = RepositoryItem::findOrFail($id);
        $title = $item->title;

        // Delete associated file
        if ($item->file_path && Storage::disk('local')->exists($item->file_path)) {
            Storage::disk('local')->delete($item->file_path);
        }

        $item->delete();

        ActivityLog::log('repository_delete', "Deleted repository item {$title}", $currentAdmin->id, $request->ip());

        return response()->json(['success' => true]);
    }

    /**
     * Download a repository file (authenticated admin or student for public items).
     */
    public function download(Request $request, int $id): BinaryFileResponse|StreamedResponse|JsonResponse
    {
        $item = RepositoryItem::findOrFail($id);

        if (! $item->file_path || ! Storage::disk('local')->exists($item->file_path)) {
            return response()->json(['message' => 'File tidak ditemukan.'], 404);
        }

        $user = $this->resolveDownloadUser($request);

        // If student, only allow download of public items
        if ($user instanceof Student) {
            if ($item->visibility !== 'public') {
                return response()->json(['message' => 'Akses ditolak.'], 403);
            }
        } elseif ($user instanceof Admin) {
            // Admins with guru_bk role can access all, guru role can access public only
            if ($user->isGuru() && $item->visibility !== 'public') {
                return response()->json(['message' => 'Akses ditolak.'], 403);
            }
        } else {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $fullPath = Storage::disk('local')->path($item->file_path);

        return response()->download(
            $fullPath,
            $item->file_original_name ?? 'download'
        );
    }

    /**
     * Public index — list only public repository items (for students and guru).
     */
    public function publicIndex(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $items = RepositoryItem::with('creator:id,username')
            ->where('visibility', 'public')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (RepositoryItem $item) => [
                'id' => $item->id,
                'title' => $item->title,
                'summary' => $item->summary,
                'content' => $item->content,
                'linkUrl' => $item->link_url,
                'fileName' => $item->file_original_name,
                'fileSize' => $item->file_size,
                'hasFile' => $item->file_path !== null,
                'createdBy' => $item->creator?->username ?? 'Guru BK',
                'createdAt' => $item->created_at?->toISOString(),
            ]);

        return response()->json($items);
    }

    private function requireAdmin(Request $request): Admin|JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof Admin || ! $user->isGuruBK()) {
            return response()->json(['message' => 'Unauthorized. Guru BK only.'], 403);
        }

        return $user;
    }

    private function resolveDownloadUser(Request $request): Admin|Student|null
    {
        $user = $request->user();

        if ($user instanceof Admin || $user instanceof Student) {
            return $user;
        }

        $plainTextToken = $request->query('token');

        if (! is_string($plainTextToken) || trim($plainTextToken) === '') {
            $plainTextToken = $request->bearerToken();
        }

        if (! is_string($plainTextToken) || trim($plainTextToken) === '') {
            return null;
        }

        $accessToken = PersonalAccessToken::findToken($plainTextToken);
        $tokenable = $accessToken?->tokenable;

        if ($tokenable instanceof Admin || $tokenable instanceof Student) {
            return $tokenable;
        }

        return null;
    }
}
