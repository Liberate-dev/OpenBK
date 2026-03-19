<?php

use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminManagementController;
use App\Http\Controllers\Api\CounselingRecordController;
use App\Http\Controllers\Api\CounselingReportController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\PublicReportAuthController;
use App\Http\Controllers\Api\PublicReportController;
use App\Http\Controllers\Api\RecognizedReporterController;
use App\Http\Controllers\Api\RepositoryController;
use App\Http\Controllers\Api\StudentAuthController;
use App\Http\Controllers\Api\StudentProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    $referenceIdPattern = '[A-Za-z0-9-]{1,30}';

    // Student endpoints
    Route::post('/students/register', [StudentAuthController::class, 'register']);
    Route::post('/students/login', [StudentAuthController::class, 'login']);
    Route::post('/students/request-password-reset', [StudentAuthController::class, 'requestPasswordReset']);

    // Protected student endpoints
    Route::middleware('auth:sanctum')->group(function () use ($referenceIdPattern) {
        Route::post('/messages', [MessageController::class, 'store']);
        Route::get('/messages/history', [MessageController::class, 'studentHistory']);
        Route::post('/messages/{referenceId}/reply', [MessageController::class, 'studentReply'])
            ->where('referenceId', $referenceIdPattern);
    });

    // Admin auth endpoints (public)
    Route::post('/admin/login', [AdminAuthController::class, 'login']);
    Route::post('/admin/generate-token', [AdminAuthController::class, 'generateToken']);
    Route::post('/admin/verify-token', [AdminAuthController::class, 'verifyToken']);
    Route::post('/report-access/generate-token', [PublicReportAuthController::class, 'generateToken']);
    Route::post('/report-access/verify-token', [PublicReportAuthController::class, 'verifyToken']);
    Route::post('/public-reports', [PublicReportController::class, 'store']);

    // Protected admin endpoints (both roles)
    Route::middleware('auth:sanctum')->group(function () use ($referenceIdPattern) {
        // Guru BK endpoints
        Route::get('/admin/messages', [MessageController::class, 'index']);
        Route::get('/admin/messages/{referenceId}', [MessageController::class, 'show'])
            ->where('referenceId', $referenceIdPattern);
        Route::post('/admin/messages/{referenceId}/reply', [MessageController::class, 'reply'])
            ->where('referenceId', $referenceIdPattern);
        Route::get('/admin/repository', [RepositoryController::class, 'index']);
        Route::post('/admin/repository', [RepositoryController::class, 'store']);
        Route::put('/admin/repository/{id}', [RepositoryController::class, 'update'])->whereNumber('id');
        Route::delete('/admin/repository/{id}', [RepositoryController::class, 'destroy'])->whereNumber('id');
        Route::get('/admin/student-profiles', [StudentProfileController::class, 'index']);
        Route::put('/admin/student-profiles/{id}', [StudentProfileController::class, 'update'])->whereNumber('id');
        Route::get('/admin/counseling-records', [CounselingRecordController::class, 'index']);
        Route::post('/admin/counseling-records', [CounselingRecordController::class, 'store']);
        Route::put('/admin/counseling-records/{id}', [CounselingRecordController::class, 'update'])->whereNumber('id');
        Route::delete('/admin/counseling-records/{id}', [CounselingRecordController::class, 'destroy'])->whereNumber('id');
        Route::get('/admin/dashboard-summary', [CounselingReportController::class, 'dashboardSummary']);
        Route::get('/admin/reports/summary', [CounselingReportController::class, 'summary']);
        Route::get('/admin/reports/export', [CounselingReportController::class, 'export']);

        // Admin IT endpoints
        Route::get('/admin/users', [AdminManagementController::class, 'index']);
        Route::post('/admin/users', [AdminManagementController::class, 'store']);
        Route::put('/admin/users/{id}', [AdminManagementController::class, 'update'])->whereNumber('id');
        Route::delete('/admin/users/{id}', [AdminManagementController::class, 'destroy'])->whereNumber('id');
        Route::get('/admin/recognized-reporters', [RecognizedReporterController::class, 'index']);
        Route::post('/admin/recognized-reporters', [RecognizedReporterController::class, 'store']);
        Route::put('/admin/recognized-reporters/{id}', [RecognizedReporterController::class, 'update'])->whereNumber('id');
        Route::delete('/admin/recognized-reporters/{id}', [RecognizedReporterController::class, 'destroy'])->whereNumber('id');
        Route::get('/admin/logs', [AdminManagementController::class, 'logs']);
        Route::get('/admin/students', [AdminManagementController::class, 'students']);
        Route::get('/admin/student-reset-requests', [AdminManagementController::class, 'resetRequests']);
        Route::post('/admin/students/{id}/reset-password', [AdminManagementController::class, 'resetStudentPassword'])
            ->whereNumber('id');

        Route::get('/admin/nis', [\App\Http\Controllers\Api\AllowedNisController::class, 'index']);
        Route::post('/admin/nis', [\App\Http\Controllers\Api\AllowedNisController::class, 'store']);
        Route::post('/admin/nis/import', [\App\Http\Controllers\Api\AllowedNisController::class, 'import']);
        Route::put('/admin/nis/{id}', [\App\Http\Controllers\Api\AllowedNisController::class, 'update'])->whereNumber('id');
        Route::delete('/admin/nis/{id}', [\App\Http\Controllers\Api\AllowedNisController::class, 'destroy'])->whereNumber('id');

        // Risk Dictionary endpoints
        Route::get('/admin/risk-dictionary', [\App\Http\Controllers\Api\RiskDictionaryController::class, 'index']);
        Route::post('/admin/risk-dictionary', [\App\Http\Controllers\Api\RiskDictionaryController::class, 'store']);
        Route::put('/admin/risk-dictionary/{id}', [\App\Http\Controllers\Api\RiskDictionaryController::class, 'update'])
            ->whereNumber('id');
        Route::delete('/admin/risk-dictionary/{id}', [\App\Http\Controllers\Api\RiskDictionaryController::class, 'destroy'])
            ->whereNumber('id');
    });
});
