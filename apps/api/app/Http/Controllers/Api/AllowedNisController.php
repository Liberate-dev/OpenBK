<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Admin;
use App\Models\AllowedNis;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use InvalidArgumentException;
use RuntimeException;
use SimpleXMLElement;
use ZipArchive;

class AllowedNisController extends Controller
{
    /**
     * @var string[]
     */
    private const NIS_HEADER_ALIASES = [
        'nis',
        'nomorinduksiswa',
        'nomorinduk',
        'noinduksiswa',
        'induksiswa',
    ];

    /**
     * @var string[]
     */
    private const NAME_HEADER_ALIASES = [
        'nama',
        'namasiswa',
        'namalengkap',
    ];

    public function index(Request $request): JsonResponse
    {
        $currentAdmin = $request->user();
        if (! $currentAdmin instanceof Admin || ! $currentAdmin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $nisList = AllowedNis::orderBy('created_at', 'desc')->get();

        return response()->json($nisList);
    }

    public function store(Request $request): JsonResponse
    {
        $currentAdmin = $request->user();
        if (! $currentAdmin instanceof Admin || ! $currentAdmin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $request->merge([
            'nis' => preg_replace('/\s+/', '', (string) $request->input('nis')),
            'name' => $request->has('name')
                ? trim((string) $request->input('name'))
                : null,
        ]);

        $validated = $request->validate([
            'nis' => ['bail', 'required', 'string', 'regex:/^\d{4,12}$/', 'unique:allowed_nis,nis'],
            'name' => ['nullable', 'string', 'max:100'],
        ]);

        $entry = AllowedNis::create([
            'nis' => $validated['nis'],
            'name' => $validated['name'] ?? null,
        ]);

        ActivityLog::log('add_nis', "Added NIS {$entry->nis}", $currentAdmin->id, $request->ip());

        return response()->json([
            'success' => true,
            'entry' => $entry,
        ], 201);
    }

    public function import(Request $request): JsonResponse
    {
        $currentAdmin = $request->user();
        if (! $currentAdmin instanceof Admin || ! $currentAdmin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $request->validate([
            'file' => 'required|file|max:10240|mimes:csv,txt,xlsx',
        ]);

        $uploadedFile = $request->file('file');
        if (! $uploadedFile instanceof UploadedFile) {
            return response()->json(['message' => 'File tidak valid.'], 422);
        }

        try {
            $rows = $this->extractRowsFromFile($uploadedFile);
        } catch (InvalidArgumentException|RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        if (count($rows) < 2) {
            return response()->json([
                'message' => 'File tidak memiliki data siswa untuk diimpor.',
            ], 422);
        }

        try {
            [$nisColumnIndex, $nameColumnIndex] = $this->resolveRequiredColumns($rows[0]);
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $ignoredColumns = $this->collectIgnoredColumns($rows[0], $nisColumnIndex, $nameColumnIndex);
        $preparedRows = [];
        $skippedEmptyNis = 0;
        $skippedInvalidNis = 0;
        $skippedDuplicateInFile = 0;
        $now = now();

        foreach (array_slice($rows, 1) as $row) {
            $nis = $this->normalizeNisValue($row[$nisColumnIndex] ?? '');
            $name = $this->normalizeNameValue($row[$nameColumnIndex] ?? '');

            if ($nis === '') {
                $skippedEmptyNis++;

                continue;
            }

            if (! $this->isImportableNis($nis)) {
                $skippedInvalidNis++;

                continue;
            }

            if (array_key_exists($nis, $preparedRows)) {
                $skippedDuplicateInFile++;

                continue;
            }

            $preparedRows[$nis] = [
                'nis' => $nis,
                'name' => $name === '' ? null : $name,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (count($preparedRows) === 0) {
            return response()->json([
                'message' => 'Tidak ada data valid untuk diimpor. Pastikan kolom NIS berisi angka 4-12 digit.',
            ], 422);
        }

        $nisKeys = array_keys($preparedRows);
        $existingNis = AllowedNis::whereIn('nis', $nisKeys)->pluck('nis')->all();
        $existingSet = array_flip($existingNis);
        $updated = count($existingSet);
        $inserted = count($preparedRows) - $updated;

        DB::transaction(function () use ($preparedRows): void {
            AllowedNis::upsert(
                array_values($preparedRows),
                ['nis'],
                ['name', 'updated_at']
            );
        });

        $imported = $inserted + $updated;
        $totalRows = max(count($rows) - 1, 0);

        ActivityLog::log(
            'import_nis',
            "Imported NIS list: {$imported} rows ({$inserted} inserted, {$updated} updated)",
            $currentAdmin->id,
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Import NIS berhasil diproses.',
            'summary' => [
                'total_rows' => $totalRows,
                'imported' => $imported,
                'inserted' => $inserted,
                'updated' => $updated,
                'skipped_empty_nis' => $skippedEmptyNis,
                'skipped_invalid_nis' => $skippedInvalidNis,
                'skipped_duplicate_in_file' => $skippedDuplicateInFile,
                'ignored_columns' => $ignoredColumns,
            ],
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $currentAdmin = $request->user();
        if (! $currentAdmin instanceof Admin || ! $currentAdmin->isAdmin()) {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $entry = AllowedNis::findOrFail($id);

        $request->merge([
            'nis' => $request->has('nis')
                ? preg_replace('/\s+/', '', (string) $request->input('nis'))
                : $request->input('nis'),
            'name' => $request->has('name')
                ? trim((string) $request->input('name'))
                : $request->input('name'),
        ]);

        $validated = $request->validate([
            'nis' => [
                'sometimes',
                'filled',
                'string',
                'regex:/^\d{4,12}$/',
                Rule::unique('allowed_nis', 'nis')->ignore($id),
            ],
            'name' => ['sometimes', 'nullable', 'string', 'max:100'],
        ]);

        if (array_key_exists('nis', $validated)) {
            $entry->nis = $validated['nis'];
        }
        if (array_key_exists('name', $validated)) {
            $entry->name = $validated['name'] ?: null;
        }

        $entry->save();

        ActivityLog::log('update_nis', "Updated NIS {$entry->nis}", $currentAdmin->id, $request->ip());

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

        $entry = AllowedNis::findOrFail($id);
        $nis = $entry->nis;
        $entry->delete();

        ActivityLog::log('delete_nis', "Deleted NIS {$nis}", $currentAdmin->id, $request->ip());

        return response()->json(['success' => true]);
    }

    private function extractRowsFromFile(UploadedFile $file): array
    {
        $path = $file->getRealPath();
        if ($path === false) {
            throw new RuntimeException('Gagal membaca file upload.');
        }

        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: '');

        if (in_array($extension, ['csv', 'txt'], true)) {
            return $this->parseCsvRows($path);
        }

        if ($extension === 'xlsx') {
            return $this->parseXlsxRows($path);
        }

        throw new InvalidArgumentException('Format file tidak didukung. Gunakan CSV atau XLSX.');
    }

    private function parseCsvRows(string $filePath): array
    {
        $handle = fopen($filePath, 'rb');
        if ($handle === false) {
            throw new RuntimeException('Gagal membuka file CSV.');
        }

        $firstLine = fgets($handle);
        if ($firstLine === false) {
            fclose($handle);

            return [];
        }

        $delimiter = $this->detectCsvDelimiter($firstLine);
        rewind($handle);

        $rows = [];
        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            if ($row === [null]) {
                continue;
            }

            $cleaned = array_map(
                fn ($value): string => $this->cleanCellValue((string) ($value ?? '')),
                $row
            );

            if ($this->rowIsCompletelyEmpty($cleaned)) {
                continue;
            }

            $rows[] = $cleaned;
        }

        fclose($handle);

        return $rows;
    }

    private function detectCsvDelimiter(string $line): string
    {
        $candidates = [',', ';', "\t", '|'];
        $bestDelimiter = ',';
        $bestCount = -1;

        foreach ($candidates as $candidate) {
            $count = substr_count($line, $candidate);
            if ($count > $bestCount) {
                $bestCount = $count;
                $bestDelimiter = $candidate;
            }
        }

        return $bestDelimiter;
    }

    private function parseXlsxRows(string $filePath): array
    {
        if (! class_exists(ZipArchive::class)) {
            throw new InvalidArgumentException(
                'Server belum mendukung impor XLSX karena ekstensi PHP ZipArchive belum aktif. Aktifkan extension=zip atau simpan file sebagai CSV.'
            );
        }

        $zip = new ZipArchive;
        if ($zip->open($filePath) !== true) {
            throw new InvalidArgumentException('File XLSX tidak bisa dibuka.');
        }

        $sharedStrings = [];
        $sharedStringsXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($sharedStringsXml !== false) {
            $sharedStrings = $this->parseSharedStrings($sharedStringsXml);
        }

        $worksheetPath = $this->findFirstWorksheetPath($zip);
        if ($worksheetPath === null) {
            $zip->close();
            throw new InvalidArgumentException('Worksheet pada file XLSX tidak ditemukan.');
        }

        $worksheetXml = $zip->getFromName($worksheetPath);
        $zip->close();

        if ($worksheetXml === false) {
            throw new InvalidArgumentException('Isi worksheet XLSX tidak bisa dibaca.');
        }

        $sheetXml = simplexml_load_string($worksheetXml);
        if ($sheetXml === false) {
            throw new InvalidArgumentException('Format worksheet XLSX tidak valid.');
        }

        $rows = [];
        $rowNodes = $sheetXml->xpath('//*[local-name()="sheetData"]/*[local-name()="row"]') ?: [];

        foreach ($rowNodes as $rowNode) {
            $rowData = [];
            $cells = $rowNode->xpath('./*[local-name()="c"]') ?: [];

            foreach ($cells as $cell) {
                $attributes = $cell->attributes();
                $reference = strtoupper((string) ($attributes['r'] ?? ''));
                $columnIndex = $this->columnReferenceToIndex($reference);

                if ($columnIndex === null) {
                    continue;
                }

                $type = (string) ($attributes['t'] ?? '');
                $value = $this->extractXlsxCellValue($cell, $type, $sharedStrings);
                $rowData[$columnIndex] = $this->cleanCellValue($value);
            }

            if (count($rowData) === 0) {
                continue;
            }

            ksort($rowData);
            $maxColumnIndex = max(array_keys($rowData));
            $denseRow = array_fill(0, $maxColumnIndex + 1, '');

            foreach ($rowData as $columnIndex => $value) {
                $denseRow[$columnIndex] = $value;
            }

            if ($this->rowIsCompletelyEmpty($denseRow)) {
                continue;
            }

            $rows[] = $denseRow;
        }

        return $rows;
    }

    /**
     * @return string[]
     */
    private function parseSharedStrings(string $xmlContent): array
    {
        $xml = simplexml_load_string($xmlContent);
        if ($xml === false) {
            return [];
        }

        $strings = [];
        $items = $xml->xpath('//*[local-name()="si"]') ?: [];

        foreach ($items as $item) {
            $textParts = $item->xpath('.//*[local-name()="t"]') ?: [];
            $value = '';

            foreach ($textParts as $textPart) {
                $value .= (string) $textPart;
            }

            $strings[] = $this->cleanCellValue($value);
        }

        return $strings;
    }

    private function findFirstWorksheetPath(ZipArchive $zip): ?string
    {
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if ($name === false) {
                continue;
            }

            $lower = strtolower($name);
            if (str_starts_with($lower, 'xl/worksheets/sheet') && str_ends_with($lower, '.xml')) {
                return $name;
            }
        }

        return null;
    }

    /**
     * @param  string[]  $sharedStrings
     */
    private function extractXlsxCellValue(SimpleXMLElement $cell, string $type, array $sharedStrings): string
    {
        if ($type === 's') {
            $valueNodes = $cell->xpath('./*[local-name()="v"]') ?: [];
            if (count($valueNodes) === 0) {
                return '';
            }

            $index = (int) ((string) $valueNodes[0]);

            return $sharedStrings[$index] ?? '';
        }

        if ($type === 'inlineStr') {
            $inlineNodes = $cell->xpath('./*[local-name()="is"]/*[local-name()="t"]') ?: [];
            $value = '';

            foreach ($inlineNodes as $inlineNode) {
                $value .= (string) $inlineNode;
            }

            return $value;
        }

        $valueNodes = $cell->xpath('./*[local-name()="v"]') ?: [];
        if (count($valueNodes) === 0) {
            return '';
        }

        return (string) $valueNodes[0];
    }

    private function columnReferenceToIndex(string $reference): ?int
    {
        if (! preg_match('/^[A-Z]+/', $reference, $matches)) {
            return null;
        }

        $letters = $matches[0];
        $index = 0;

        for ($i = 0; $i < strlen($letters); $i++) {
            $index = ($index * 26) + (ord($letters[$i]) - 64);
        }

        return $index - 1;
    }

    /**
     * @param  string[]  $headerRow
     * @return int[]
     */
    private function resolveRequiredColumns(array $headerRow): array
    {
        $nisIndex = null;
        $nameIndex = null;

        foreach ($headerRow as $index => $header) {
            $normalized = $this->normalizeHeader($this->cleanCellValue((string) $header));
            if ($normalized === '') {
                continue;
            }

            if ($nisIndex === null && in_array($normalized, self::NIS_HEADER_ALIASES, true)) {
                $nisIndex = $index;
            }

            if ($nameIndex === null && in_array($normalized, self::NAME_HEADER_ALIASES, true)) {
                $nameIndex = $index;
            }
        }

        if ($nisIndex === null || $nameIndex === null) {
            throw new InvalidArgumentException(
                'Header tidak valid. Pastikan file memiliki kolom "NIS" dan "Nama Siswa".'
            );
        }

        return [$nisIndex, $nameIndex];
    }

    /**
     * @param  string[]  $headerRow
     * @return string[]
     */
    private function collectIgnoredColumns(array $headerRow, int $nisColumnIndex, int $nameColumnIndex): array
    {
        $ignored = [];

        foreach ($headerRow as $index => $header) {
            if ($index === $nisColumnIndex || $index === $nameColumnIndex) {
                continue;
            }

            $headerValue = $this->cleanCellValue((string) $header);
            if ($headerValue !== '') {
                $ignored[] = $headerValue;
            }
        }

        return $ignored;
    }

    private function normalizeHeader(string $header): string
    {
        $header = $this->cleanCellValue($header);
        $lower = function_exists('mb_strtolower')
            ? mb_strtolower($header, 'UTF-8')
            : strtolower($header);

        $normalized = preg_replace('/[^a-z0-9]+/u', '', $lower);

        return $normalized ?? '';
    }

    private function normalizeNisValue(string $value): string
    {
        $value = $this->cleanCellValue($value);
        if ($value === '') {
            return '';
        }

        $value = str_replace("\u{00A0}", ' ', $value);
        $value = preg_replace('/\s+/', '', $value) ?? '';

        if (preg_match('/^\d+(\.0+)?$/', $value)) {
            $trimmed = preg_replace('/\.0+$/', '', $value);

            return $trimmed ?? $value;
        }

        $digitsOnly = preg_replace('/\D+/', '', $value);

        return $digitsOnly ?? '';
    }

    private function normalizeNameValue(string $value): string
    {
        $value = $this->cleanCellValue($value);
        $value = preg_replace('/\s+/u', ' ', $value) ?? $value;

        if (function_exists('mb_substr')) {
            return mb_substr($value, 0, 100, 'UTF-8');
        }

        return substr($value, 0, 100);
    }

    private function isImportableNis(string $nis): bool
    {
        return (bool) preg_match('/^\d{4,12}$/', $nis);
    }

    /**
     * @param  string[]  $row
     */
    private function rowIsCompletelyEmpty(array $row): bool
    {
        foreach ($row as $value) {
            if ($this->cleanCellValue((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }

    private function cleanCellValue(string $value): string
    {
        $value = preg_replace('/^\xEF\xBB\xBF/', '', $value) ?? $value;

        return trim($value);
    }
}
