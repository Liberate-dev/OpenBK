<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->enum('role', ['admin', 'guru_bk'])->default('guru_bk')->after('password');
            $table->string('whatsapp', 20)->nullable()->after('role');
            $table->string('otp_code', 6)->nullable()->after('whatsapp');
            $table->timestamp('otp_expires_at')->nullable()->after('otp_code');
        });
    }

    public function down(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->dropColumn(['role', 'whatsapp', 'otp_code', 'otp_expires_at']);
        });
    }
};
