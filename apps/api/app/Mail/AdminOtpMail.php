<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $otpCode;

    public function __construct(string $otpCode)
    {
        $this->otpCode = $otpCode;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Kode OTP Login Admin - Open BK',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.admin-otp',
            with: [
                'otpCode' => $this->otpCode,
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
