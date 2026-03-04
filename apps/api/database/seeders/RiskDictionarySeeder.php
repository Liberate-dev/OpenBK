<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RiskDictionary;

class RiskDictionarySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $dictionary = [
            'critical' => [
                'bunuh diri' => 12,
                'ingin mati' => 12,
                'mau mati' => 12,
                'akhiri hidup' => 12,
                'menyakiti diri' => 12,
                'self harm' => 12,
            ],
            'high' => [
                'depresi' => 8,
                'stress berat' => 8,
                'tertekan banget' => 8,
                'dipukul' => 8,
                'kekerasan' => 8,
                'ancaman' => 8,
                'diperas' => 8,
            ],
            'medium' => [
                'stress' => 5,
                'stres' => 5,
                'cemas' => 5,
                'takut' => 5,
                'dibully' => 5,
                'bullying' => 5,
                'dikucilkan' => 5,
                'diejek terus' => 5,
            ],
            'low' => [
                'sedih' => 2,
                'capek mental' => 2,
                'kurang nyaman' => 2,
                'ganggu' => 2,
                'konflik teman' => 2,
            ],
        ];

        foreach ($dictionary as $level => $words) {
            foreach ($words as $word => $weight) {
                RiskDictionary::firstOrCreate(
                    ['word' => $word],
                    ['risk_level' => $level, 'weight' => $weight]
                );
            }
        }
    }
}
