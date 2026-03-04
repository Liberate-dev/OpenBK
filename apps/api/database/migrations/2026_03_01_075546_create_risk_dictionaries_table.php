<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('risk_dictionaries', function (Blueprint $table) {
            $table->id();
            $table->string('word')->unique();
            $table->enum('risk_level', ['critical', 'high', 'medium', 'low']);
            $table->integer('weight');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('risk_dictionaries');
    }
};
