<?php

use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminManagementController;
use App\Http\Controllers\Api\CounselingRecordController;
use App\Http\Controllers\Api\CounselingReportController;
use App\Http\Controllers\Api\GuruReportController;
use App\Http\Controllers\Api\MessageController;
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

    Route::get('/student/repository/{id}/download', [RepositoryController::class, 'download'])->whereNumber('id');

    // Protected student endpoints
    Route::middleware('auth:sanctum')->group(function () use ($referenceIdPattern) {
        Route::post('/messages', [MessageController::class, 'store']);
        Route::get('/messages/history', [MessageController::class, 'studentHistory']);
        Route::post('/messages/{referenceId}/reply', [MessageController::class, 'studentReply'])
            ->where('referenceId', $referenceIdPattern);

        // Student repository (public items only)
        Route::get('/student/repository', [RepositoryController::class, 'publicIndex']);
    });

    // Admin auth endpoints (public)
    Route::post('/admin/login', [AdminAuthController::class, 'login']);
    Route::post('/admin/generate-token', [AdminAuthController::class, 'generateToken']);
    Route::post('/admin/verify-token', [AdminAuthController::class, 'verifyToken']);
    Route::get('/admin/repository/{id}/download', [RepositoryController::class, 'download'])->whereNumber('id');

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

        // Guru (regular teacher) endpoints
        Route::post('/admin/guru/reports', [GuruReportController::class, 'store']);
        Route::get('/admin/guru/repository', [RepositoryController::class, 'publicIndex']);

        // Admin IT endpoints
        Route::get('/admin/users', [AdminManagementController::class, 'index']);
        Route::post('/admin/users', [AdminManagementController::class, 'store']);
        Route::put('/admin/users/{id}', [AdminManagementController::class, 'update'])->whereNumber('id');
        Route::delete('/admin/users/{id}', [AdminManagementController::class, 'destroy'])->whereNumber('id');
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
