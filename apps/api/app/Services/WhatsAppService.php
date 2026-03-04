<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    public function sendOtp(string $phone, string $otpCode): bool
    {
        $token = config('services.fonnte.token');

        if (empty($token)) {
            Log::warning('[WhatsApp] FONNTE_TOKEN not configured, logging OTP instead.');
            Log::info("[WhatsApp] OTP for {$phone}: {$otpCode}");
            return true; // Simulate success for dev
        }

        $message = "🔐 *Kode OTP Open BK*\n\nKode verifikasi Anda: *{$otpCode}*\n\nKode ini berlaku selama 5 menit.\nJangan bagikan kode ini kepada siapapun.";

        try {
            $response = Http::withHeaders([
                'Authorization' => $token,
            ])->post('https://api.fonnte.com/send', [
                        'target' => $phone,
                        'message' => $message,
                    ]);

            if ($response->successful()) {
                Log::info("[WhatsApp] OTP sent to {$phone}");
                return true;
            }

            Log::error("[WhatsApp] Failed to send OTP: " . $response->body());
            return false;
        } catch (\Exception $e) {
            Log::error("[WhatsApp] Exception: " . $e->getMessage());
            return false;
        }
    }
}
