<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\RiskDictionary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RiskDictionaryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $currentAdmin = $request->user();
        if (! $currentAdmin instanceof Admin) {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $words = RiskDictionary::orderBy('risk_level')->orderBy('word')->get();

        return response()->json($words);
    }

    public function store(Request $request): JsonResponse
    {
        $currentAdmin = $request->user();
        if (! $currentAdmin instanceof Admin || ! $currentAdmin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $request->merge([
            'word' => trim(mb_strtolower((string) $request->input('word'))),
        ]);

        $validated = $request->validate([
            'word' => ['bail', 'required', 'string', 'min:2', 'max:100', 'unique:risk_dictionaries,word'],
            'risk_level' => ['required', Rule::in(['critical', 'high', 'medium', 'low'])],
            'weight' => ['required', 'integer', 'min:1', 'max:1000'],
        ]);

        $entry = RiskDictionary::create([
            'word' => $validated['word'],
            'risk_level' => $validated['risk_level'],
            'weight' => $validated['weight'],
        ]);

        return response()->json([
            'success' => true,
            'entry' => $entry,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $currentAdmin = $request->user();
        if (! $currentAdmin instanceof Admin || ! $currentAdmin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $entry = RiskDictionary::findOrFail($id);

        $request->merge([
            'word' => $request->has('word')
                ? trim(mb_strtolower((string) $request->input('word')))
                : $request->input('word'),
        ]);

        $validated = $request->validate([
            'word' => ['sometimes', 'filled', 'string', 'min:2', 'max:100', Rule::unique('risk_dictionaries', 'word')->ignore($id)],
            'risk_level' => ['sometimes', Rule::in(['critical', 'high', 'medium', 'low'])],
            'weight' => ['sometimes', 'integer', 'min:1', 'max:1000'],
        ]);

        if (array_key_exists('word', $validated)) {
            $entry->word = $validated['word'];
        }
        if (array_key_exists('risk_level', $validated)) {
            $entry->risk_level = $validated['risk_level'];
        }
        if (array_key_exists('weight', $validated)) {
            $entry->weight = $validated['weight'];
        }

        $entry->save();

        return response()->json([
            'success' => true,
            'entry' => $entry,
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $currentAdmin = $request->user();
        if (! $currentAdmin instanceof Admin || ! $currentAdmin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $entry = RiskDictionary::findOrFail($id);
        $entry->delete();

        return response()->json(['success' => true]);
    }
}
