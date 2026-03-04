<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Admin;
use App\Models\Message;
use App\Models\Reply;
use App\Models\Student;
use App\Services\RiskScoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function store(Request $request, RiskScoringService $riskService): JsonResponse
    {
        $student = $this->requireStudent($request);
        if ($student instanceof JsonResponse) {
            return $student;
        }

        $request->merge([
            'message' => trim((string) $request->input('message')),
        ]);

        $validated = $request->validate([
            'message' => ['required', 'string', 'min:10', 'max:500'],
        ]);

        $riskResult = $riskService->analyze($validated['message']);

        $message = Message::create([
            'reference_id' => 'ltr-'.time().'-'.random_int(100, 999),
            'student_id' => $student->id,
            'body' => $validated['message'],
            'risk_level' => $riskResult['risk_level'],
            'risk_score' => $riskResult['risk_score'],
            'risk_tags' => $riskResult['risk_tags'],
        ]);

        return response()->json([
            'accepted' => true,
            'referenceId' => $message->reference_id,
        ], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $admin = $this->requireAdmin($request);
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $messages = Message::query()
            ->with('student:id,nis')
            ->withCount('replies')
            ->orderByRaw("
                CASE risk_level
                    WHEN 'critical' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    ELSE 4
                END
            ")
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Message $m) => [
                'id' => $m->reference_id,
                'preview' => \Illuminate\Support\Str::limit($m->body, 160),
                'authorNis' => $m->student?->nis,
                'riskLevel' => $m->risk_level,
                'riskScore' => $m->risk_score,
                'submittedAt' => $m->created_at->toISOString(),
                'hasReplies' => $m->replies_count > 0,
            ]);

        return response()->json($messages);
    }

    public function show(Request $request, string $referenceId): JsonResponse
    {
        $admin = $this->requireAdmin($request);
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        if (! $this->isValidReferenceId($referenceId)) {
            return response()->json([
                'message' => 'Reference ID tidak valid.',
            ], 422);
        }

        $message = Message::with('student:id,nis')
            ->with(['replies.admin:id,username', 'replies.student:id,nis'])
            ->where('reference_id', $referenceId)
            ->firstOrFail();

        // Mark as read
        if (! $message->is_read) {
            $message->is_read = true;
            $message->save();
        }

        return response()->json([
            'id' => $message->reference_id,
            'body' => $message->body,
            'authorNis' => $message->student?->nis,
            'riskLevel' => $message->risk_level,
            'riskScore' => $message->risk_score,
            'riskTags' => $message->risk_tags,
            'submittedAt' => $message->created_at->toISOString(),
            'replies' => $message->replies->map(fn (Reply $r) => [
                'id' => $r->id,
                'body' => $r->body,
                'adminName' => $r->admin ? ($r->admin->username ?? 'Guru BK') : null,
                'studentNis' => $r->student ? $r->student->nis : null,
                'createdAt' => $r->created_at->toISOString(),
            ]),
        ]);
    }

    public function reply(Request $request, string $referenceId): JsonResponse
    {
        $admin = $this->requireAdmin($request);
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        if (! $this->isValidReferenceId($referenceId)) {
            return response()->json([
                'message' => 'Reference ID tidak valid.',
            ], 422);
        }

        $request->merge([
            'body' => trim((string) $request->input('body')),
        ]);

        $validated = $request->validate([
            'body' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        $message = Message::where('reference_id', $referenceId)->firstOrFail();

        $reply = Reply::create([
            'message_id' => $message->id,
            'admin_id' => $admin->id,
            'body' => $validated['body'],
        ]);

        ActivityLog::log('reply', "Replied to message {$referenceId}", $admin->id, $request->ip());

        return response()->json([
            'success' => true,
            'reply' => [
                'id' => $reply->id,
                'body' => $reply->body,
                'adminName' => $admin->username,
                'createdAt' => $reply->created_at->toISOString(),
            ],
        ], 201);
    }

    public function studentHistory(Request $request): JsonResponse
    {
        $student = $this->requireStudent($request);
        if ($student instanceof JsonResponse) {
            return $student;
        }

        $messages = Message::with(['replies.admin:id,username', 'replies.student:id,nis'])
            ->where('student_id', $student->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Message $m) => [
                'id' => $m->reference_id,
                'preview' => mb_substr($m->body, 0, 80),
                'body' => $m->body,
                'riskLevel' => $m->risk_level,
                'submittedAt' => $m->created_at->toISOString(),
                'repliesCount' => $m->replies->count(),
                'replies' => $m->replies->map(fn (Reply $r) => [
                    'id' => $r->id,
                    'body' => $r->body,
                    'adminName' => $r->admin ? ($r->admin->username ?? 'Guru BK') : null,
                    'isOwnReply' => $r->student_id === $student->id,
                    'createdAt' => $r->created_at->toISOString(),
                ]),
            ]);

        return response()->json($messages);
    }

    public function studentReply(Request $request, string $referenceId): JsonResponse
    {
        $student = $this->requireStudent($request);
        if ($student instanceof JsonResponse) {
            return $student;
        }

        if (! $this->isValidReferenceId($referenceId)) {
            return response()->json([
                'message' => 'Reference ID tidak valid.',
            ], 422);
        }

        $request->merge([
            'body' => trim((string) $request->input('body')),
        ]);

        $validated = $request->validate([
            'body' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        $message = Message::where('reference_id', $referenceId)
            ->where('student_id', $student->id)
            ->firstOrFail();

        $reply = Reply::create([
            'message_id' => $message->id,
            'student_id' => $student->id,
            'body' => $validated['body'],
        ]);

        return response()->json([
            'success' => true,
            'reply' => [
                'id' => $reply->id,
                'body' => $reply->body,
                'isOwnReply' => true,
                'adminName' => null,
                'createdAt' => $reply->created_at->toISOString(),
            ],
        ], 201);
    }

    private function requireStudent(Request $request): Student|JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof Student) {
            return response()->json(['message' => 'Unauthorized. Student only.'], 403);
        }

        return $user;
    }

    private function requireAdmin(Request $request): Admin|JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof Admin) {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        return $user;
    }

    private function isValidReferenceId(string $referenceId): bool
    {
        return (bool) preg_match('/^[A-Za-z0-9-]{1,30}$/', $referenceId);
    }
}
