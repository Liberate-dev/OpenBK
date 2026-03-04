<!DOCTYPE html>
<html>

<head>
    <style>
        body {
            font-family: sans-serif;
            background-color: #f8fafc;
            padding: 20px;
        }

        .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            max-width: 500px;
            margin: 0 auto;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .otp {
            font-size: 32px;
            font-weight: bold;
            color: #3b82f6;
            text-align: center;
            letter-spacing: 5px;
            margin: 20px 0;
            padding: 15px;
            background: #eff6ff;
            border-radius: 8px;
        }

        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #64748b;
            text-align: center;
        }
    </style>
</head>

<body>
    <div class="container">
        <h2 style="text-align: center; color: #0f172a; margin-top: 0;">Login Admin Open BK</h2>
        <p>Halo,</p>
        <p>Gunakan kode OTP berikut untuk masuk ke dashboard admin Open BK. Kode ini hanya berlaku selama 5 menit.</p>

        <div class="otp">{{ $otpCode }}</div>

        <p>Jika Anda tidak mencoba login, abaikan email ini.</p>

        <div class="footer">
            &copy; {{ date('Y') }} Open BK. All rights reserved.
        </div>
    </div>
</body>

</html>