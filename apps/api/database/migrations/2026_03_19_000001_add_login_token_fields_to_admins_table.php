<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->string('nip', 30)->nullable()->after('role');
            $table->string('full_name', 150)->nullable()->after('nip');
            $table->string('login_challenge_hash')->nullable()->after('full_name');
            $table->timestamp('login_challenge_expires_at')->nullable()->after('login_challenge_hash');
            $table->string('login_token_hash')->nullable()->after('login_challenge_expires_at');
            $table->timestamp('login_token_expires_at')->nullable()->after('login_token_hash');
            $table->unique('nip');
        });
    }

    public function down(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->dropUnique('admins_nip_unique');
            $table->dropColumn([
                'nip',
                'full_name',
                'login_challenge_hash',
                'login_challenge_expires_at',
                'login_token_hash',
                'login_token_expires_at',
            ]);
        });
    }
};
