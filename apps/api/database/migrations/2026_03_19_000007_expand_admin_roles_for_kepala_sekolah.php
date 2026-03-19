<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE admins MODIFY role ENUM('admin', 'guru_bk', 'kepala_sekolah') NOT NULL DEFAULT 'guru_bk'");
            return;
        }

        DB::table('admins')
            ->where('role', 'kepala sekolah')
            ->update(['role' => 'kepala_sekolah']);
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE admins MODIFY role ENUM('admin', 'guru_bk') NOT NULL DEFAULT 'guru_bk'");
        }
    }
};
