<?php

namespace App\Services;

class RiskScoringService
{
    /**
     * Get dictionary from database, grouped by risk_level
     */
    private function getDictionary(): array
    {
        $words = \App\Models\RiskDictionary::all();

        $dictionary = [
            'critical' => [],
            'high' => [],
            'medium' => [],
            'low' => [],
        ];

        foreach ($words as $w) {
            $dictionary[$w->risk_level][$w->word] = $w->weight;
        }

        return $dictionary;
    }

    /**
     * Analyze message body and return risk assessment
     *
     * @return array{risk_level: string, risk_score: int, risk_tags: array}
     */
    public function analyze(string $body): array
    {
        $dictionary = $this->getDictionary();
        $normalizedBody = $this->normalize($body);
        $tags = [];
        $score = 0;
        $categoriesHit = [];

        // Check phrases first (longer matches), then single words
        foreach ($dictionary as $category => $keywords) {
            foreach ($keywords as $keyword => $weight) {
                $count = substr_count($normalizedBody, $keyword);
                if ($count > 0) {
                    $score += $weight * $count;
                    $tags[] = $keyword;
                    $categoriesHit[$category] = true;
                }
            }
        }

        // Bonus: repetition (+2 if any risk word appears >= 3 times)
        $totalHits = 0;
        foreach ($dictionary as $keywords) {
            foreach ($keywords as $keyword => $weight) {
                $totalHits += substr_count($normalizedBody, $keyword);
            }
        }
        if ($totalHits >= 3) {
            $score += 2;
        }

        // Bonus: combination (+4 if >= 2 different categories detected)
        if (count($categoriesHit) >= 2) {
            $score += 4;
        }

        $riskLevel = match (true) {
            $score >= 12 => 'critical',
            $score >= 8 => 'high',
            $score >= 5 => 'medium',
            default => 'low',
        };

        return [
            'risk_level' => $riskLevel,
            'risk_score' => $score,
            'risk_tags' => array_unique($tags),
        ];
    }

    private function normalize(string $text): string
    {
        $text = mb_strtolower($text);
        // Remove punctuation but keep spaces
        $text = preg_replace('/[^\p{L}\p{N}\s]/u', '', $text);
        // Normalize common typos
        $text = str_replace('stres', 'stress', $text);
        // Collapse multiple spaces
        $text = preg_replace('/\s+/', ' ', trim($text));

        return $text;
    }
}
