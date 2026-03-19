<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('allowed_nis', function (Blueprint $table) {
            $table->string('class_name', 50)->nullable()->after('name');
            $table->string('profile_summary', 255)->nullable()->after('class_name');
            $table->text('character_notes')->nullable()->after('profile_summary');
        });
    }

    public function down(): void
    {
        Schema::table('allowed_nis', function (Blueprint $table) {
            $table->dropColumn(['class_name', 'profile_summary', 'character_notes']);
        });
    }
};
