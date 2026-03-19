<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('public_reports', function (Blueprint $table) {
            $table->id();
            $table->string('reference_id', 30)->unique();
            $table->foreignId('recognized_reporter_id')->constrained('recognized_reporters')->onDelete('cascade');
            $table->string('reporter_nip', 30);
            $table->string('reporter_alias', 120);
            $table->string('student_name', 120);
            $table->string('student_class', 50)->nullable();
            $table->string('student_nis', 30)->nullable();
            $table->string('summary', 150);
            $table->text('body');
            $table->enum('risk_level', ['low', 'medium', 'high', 'critical'])->default('low');
            $table->integer('risk_score')->default(0);
            $table->json('risk_tags')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamps();

            $table->index(['risk_level', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public_reports');
    }
};
