<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('repository_items', function (Blueprint $table) {
            $table->enum('visibility', ['private', 'public'])->default('private')->after('link_url');
            $table->string('file_path', 255)->nullable()->after('visibility');
            $table->string('file_original_name', 255)->nullable()->after('file_path');
            $table->unsignedInteger('file_size')->nullable()->after('file_original_name');
        });
    }

    public function down(): void
    {
        Schema::table('repository_items', function (Blueprint $table) {
            $table->dropColumn(['visibility', 'file_path', 'file_original_name', 'file_size']);
        });
    }
};
