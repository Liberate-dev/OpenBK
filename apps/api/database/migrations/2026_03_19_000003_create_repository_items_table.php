<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('repository_items', function (Blueprint $table) {
            $table->id();
            $table->string('title', 150);
            $table->string('category', 30)->default('repository');
            $table->string('summary', 255);
            $table->text('content');
            $table->string('link_url', 255)->nullable();
            $table->foreignId('created_by_admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repository_items');
    }
};
