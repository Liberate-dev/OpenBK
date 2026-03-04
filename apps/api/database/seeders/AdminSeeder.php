<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Admin::updateOrCreate(
            ['username' => 'admin'],
            [
                'password' => Hash::make('rahasiabk'),
                'role' => 'admin',
                'email' => null,
            ]
        );

        $guru = Admin::updateOrCreate(
            ['username' => 'guru_bk'],
            [
                'password' => Hash::make('gurubk123'),
                'role' => 'guru_bk',
                'email' => 'guru_bk@example.com',
            ]
        );
    }
}
