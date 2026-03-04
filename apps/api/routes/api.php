<?php

use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminManagementController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\StudentAuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    $referenceIdPattern = '[A-Za-z0-9-]{1,30}';

    // Student endpoints
    Route::post('/students/register', [StudentAuthController::class, 'register']);
    Route::post('/students/login', [StudentAuthController::class, 'login']);

    // Protected student endpoints
    Route::middleware('auth:sanctum')->group(function () use ($referenceIdPattern) {
        Route::post('/messages', [MessageController::class, 'store']);
        Route::get('/messages/history', [MessageController::class, 'studentHistory']);
        Route::post('/messages/{referenceId}/reply', [MessageController::class, 'studentReply'])
            ->where('referenceId', $referenceIdPattern);
    });

    // Admin auth endpoints (public)
    Route::post('/admin/login', [AdminAuthController::class, 'login']);
    Route::post('/admin/verify-otp', [AdminAuthController::class, 'verifyOtp']);

    // Protected admin endpoints (both roles)
    Route::middleware('auth:sanctum')->group(function () use ($referenceIdPattern) {
        // Guru BK endpoints
        Route::get('/admin/messages', [MessageController::class, 'index']);
        Route::get('/admin/messages/{referenceId}', [MessageController::class, 'show'])
            ->where('referenceId', $referenceIdPattern);
        Route::post('/admin/messages/{referenceId}/reply', [MessageController::class, 'reply'])
            ->where('referenceId', $referenceIdPattern);

        // Admin IT endpoints
        Route::get('/admin/users', [AdminManagementController::class, 'index']);
        Route::post('/admin/users', [AdminManagementController::class, 'store']);
        Route::put('/admin/users/{id}', [AdminManagementController::class, 'update'])->whereNumber('id');
        Route::delete('/admin/users/{id}', [AdminManagementController::class, 'destroy'])->whereNumber('id');
        Route::get('/admin/logs', [AdminManagementController::class, 'logs']);
        Route::get('/admin/students', [AdminManagementController::class, 'students']);
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
