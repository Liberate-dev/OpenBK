<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->string('reference_id', 30)->unique();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
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
        Schema::dropIfExists('messages');
    }
};
