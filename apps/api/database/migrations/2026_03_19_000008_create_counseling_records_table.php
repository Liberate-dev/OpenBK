<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('counseling_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('allowed_nis_id')->constrained('allowed_nis')->cascadeOnDelete();
            $table->date('session_date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('service_type', 40);
            $table->string('medium', 40);
            $table->string('location', 150)->nullable();
            $table->string('topic', 180);
            $table->text('objective');
            $table->text('assessment')->nullable();
            $table->text('intervention');
            $table->text('result_summary')->nullable();
            $table->text('follow_up_plan')->nullable();
            $table->string('status', 30)->default('belum_selesai');
            $table->date('next_follow_up_date')->nullable();
            $table->foreignId('created_by_admin_id')->constrained('admins')->cascadeOnDelete();
            $table->timestamps();

            $table->index(['session_date', 'status']);
            $table->index(['allowed_nis_id', 'session_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('counseling_records');
    }
};
