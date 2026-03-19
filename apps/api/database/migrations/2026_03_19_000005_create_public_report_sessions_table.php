<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('public_report_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recognized_reporter_id')->constrained('recognized_reporters')->onDelete('cascade');
            $table->text('session_token_hash');
            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public_report_sessions');
    }
};
