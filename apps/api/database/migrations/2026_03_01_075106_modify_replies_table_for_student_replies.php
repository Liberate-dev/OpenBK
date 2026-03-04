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
        Schema::table('replies', function (Blueprint $table) {
            $table->unsignedBigInteger('admin_id')->nullable()->change();
            $table->foreignId('student_id')->nullable()->after('admin_id')->constrained('students')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('replies', function (Blueprint $table) {
            $table->unsignedBigInteger('admin_id')->nullable(false)->change();
            $table->dropForeign(['student_id']);
            $table->dropColumn('student_id');
        });
    }
};
