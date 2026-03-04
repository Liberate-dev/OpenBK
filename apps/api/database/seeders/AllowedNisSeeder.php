<?php

namespace Database\Seeders;

use App\Models\AllowedNis;
use Illuminate\Database\Seeder;

class AllowedNisSeeder extends Seeder
{
    public function run(): void
    {
        $nisList = [
            ['nis' => '123456', 'name' => 'Siswa A'],
            ['nis' => '654321', 'name' => 'Siswa B'],
            ['nis' => '111111', 'name' => 'Siswa C'],
            ['nis' => '222222', 'name' => 'Siswa D'],
            ['nis' => '333333', 'name' => 'Siswa E'],
        ];

        foreach ($nisList as $entry) {
            AllowedNis::firstOrCreate(
                ['nis' => $entry['nis']],
                ['name' => $entry['name']]
            );
        }
    }
}
