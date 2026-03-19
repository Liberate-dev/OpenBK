<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('recognized_reporters', function (Blueprint $table) {
            $table->id();
            $table->string('nip', 30)->unique();
            $table->string('alias_name', 120);
            $table->string('description', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('login_challenge_hash')->nullable();
            $table->timestamp('login_challenge_expires_at')->nullable();
            $table->text('login_token_hash')->nullable();
            $table->timestamp('login_token_expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recognized_reporters');
    }
};
