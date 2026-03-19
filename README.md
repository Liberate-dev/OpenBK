# Open BK

Open BK adalah aplikasi layanan BK sekolah dengan 2 sisi utama:
- `Siswa`: login/signup berbasis NIS, kirim surat curhat, dan melihat balasan.
- `Admin/Guru BK`: triase surat berdasarkan risiko, balas surat, dan kelola operasional.

## Fitur Utama

### Sisi Siswa
- Login / signup menggunakan NIS yang sudah di-whitelist sekolah.
- Kirim surat ke BK dengan scoring risiko otomatis.
- Lihat riwayat surat.
- Balas thread surat milik sendiri.

### Sisi Guru BK
- Dashboard ringkasan surat.
- Inbox prioritas berdasarkan level risiko (`critical > high > medium > low`).
- Lihat detail surat + tag risiko.
- Balas surat siswa dalam thread.
- Kelola tampilan profil/settings sederhana.

### Sisi Admin IT
- Dashboard operasional sistem.
- Kelola user admin/guru BK.
- Kelola akun siswa dan reset password siswa.
- Kelola whitelist NIS (manual + import CSV/XLSX).
- Lihat log aktivitas sistem.
- Kelola kamus risiko (kata kunci + bobot).
- Notifikasi untuk akun siswa yang perlu reset password.

### Keamanan dan Validasi
- Auth token menggunakan Laravel Sanctum.
- Validasi input ketat untuk field penting (NIS, username, token login admin, message body, dll).
- Pembatasan role di endpoint (student vs admin/guru BK vs admin IT).
- Constraint route parameter (`id` numerik, `referenceId` tervalidasi).
- Query menggunakan Eloquent/query builder (tanpa interpolasi user input ke raw SQL).

## App Flow

### 1) Flow Siswa
1. Siswa buka `/`.
2. Siswa pilih `Masuk` atau `Daftar Baru`.
3. Backend validasi NIS terhadap tabel whitelist `allowed_nis`.
4. Jika valid, backend mengembalikan session token.
5. Siswa masuk ke `/send-letter`.
6. Saat kirim surat, backend menganalisis risiko berdasarkan kamus risiko.
7. Surat tersimpan dengan `risk_level`, `risk_score`, dan `risk_tags`.
8. Siswa bisa lihat histori di `/my-letters` dan balas thread miliknya.

### 2) Flow Guru BK
1. Guru BK login di `/admin/login`.
2. Setelah username dan password valid, generate token login memakai NIP dan nama lengkap.
3. Masukkan token login yang berlaku 5 menit.
4. Setelah login, masuk ke `/admin`.
5. Guru BK buka `/admin/inbox` untuk triase surat berdasarkan risiko.
5. Guru BK baca detail surat dan kirim balasan.

### 3) Flow Admin IT
1. Admin IT login di `/admin/login`.
2. Setelah username dan password valid, generate token login memakai NIP dan nama lengkap.
3. Masukkan token login yang berlaku 5 menit.
4. Admin masuk ke dashboard `/admin`.
5. Admin mengelola pengguna, siswa, NIS whitelist, log, dan kamus risiko.
4. Admin dapat melakukan reset password siswa (siswa wajib signup ulang).

## Tech Stack

### Frontend (`apps/web`)
- React 19 + TypeScript
- Vite
- TanStack Router (file-based routing)
- TanStack Query
- MUI v7
- Framer Motion

### Backend (`apps/api`)
- Laravel 12 (PHP 8.2+)
- Laravel Sanctum (token auth)
- MySQL (runtime utama)
- SQLite in-memory (konfigurasi default untuk test)

### Infrastruktur
- Nginx (recommended)
- PHP-FPM
- MySQL/MariaDB
- TLS/SSL (Let's Encrypt)

## Struktur Project

```text
Open BK/
├─ apps/
│  ├─ web/      # Frontend React + Vite
│  └─ api/      # Backend Laravel API
├─ reports/
└─ plan.md
```

## Setup Docker

Prasyarat:
- Docker Desktop / Docker Engine
- Docker Compose v2

Jalankan dari root project:

```bash
docker compose up --build
```

Akses service:
- Frontend + reverse proxy: `http://localhost:8080`
- Backend API langsung: `http://localhost:8000`
- MySQL host port: `127.0.0.1:3307`

Catatan:
- Compose akan menjalankan `migrate` dan `db:seed` otomatis saat backend start.
- Frontend container sudah me-route `/api/*` ke service Laravel.
- Data MySQL disimpan di volume Docker `mysql_data`.

Stop service:

```bash
docker compose down
```

Hapus service beserta volume database:

```bash
docker compose down -v
```

## Setup Lokal

## Prasyarat
- Node.js 20+
- npm 10+
- PHP 8.2+
- Composer
- MySQL 8+ atau MariaDB 10.6+

## 1) Setup Backend (Laravel API)

Masuk ke folder backend:

```bash
cd apps/api
```

Install dependency:

```bash
composer install
```

Buat file environment:

```bash
cp .env.example .env
```

Jika di Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Generate app key:

```bash
php artisan key:generate
```

Edit `.env` backend untuk database MySQL:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=openbk
DB_USERNAME=root
DB_PASSWORD=your_password
```

Konfigurasi Mailtrap (SMTP) tidak diperlukan untuk login admin saat ini.

```env
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password_or_token
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=no-reply@openbk.local
MAIL_FROM_NAME="Open BK"
```

Migrasi database:

```bash
php artisan migrate
```

Seed data awal:

```bash
php artisan db:seed
```

Jalankan backend:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

API akan tersedia di:
- `http://127.0.0.1:8000/api/v1/...`

## 2) Setup Frontend (React)

Masuk ke folder frontend:

```bash
cd apps/web
```

Install dependency:

```bash
npm install
```

Jalankan frontend:

```bash
npm run dev
```

Frontend akan tersedia di:
- `http://127.0.0.1:3000`

Catatan:
- Saat mode dev, Vite proxy sudah mengarahkan `/api` ke backend `127.0.0.1:8000`.

## Akun Seed Default (Development)

Data dari seeder:
- Admin IT
  - username: `admin`
  - password: `rahasiabk`
  - NIP: `198001012005011001`
  - nama lengkap: `Admin IT Open BK`
- Guru BK
  - username: `guru_bk`
  - password: `gurubk123`
  - NIP: `198502142010012003`
  - nama lengkap: `Guru BK Open BK`

Contoh whitelist NIS awal:
- `123456`, `654321`, `111111`, `222222`, `333333`

## Quality Check

### Backend

```bash
cd apps/api
php artisan test
./vendor/bin/pint --test
```

Catatan test:
- `phpunit.xml` default memakai SQLite in-memory.
- Jika extension `pdo_sqlite` tidak aktif, beberapa feature test akan skip.

### Frontend

```bash
cd apps/web
npm run lint
npm run typecheck
npm run build
```

## Build Production

### Frontend

```bash
cd apps/web
npm ci
npm run build
```

Output build:
- `apps/web/dist`

### Backend

```bash
cd apps/api
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan optimize
```

## SQL untuk MySQL Sekolah

### Lokasi file SQL database

Path dari root project:
- `apps/api/database/sql/openbk_structure.sql` (struktur database, tanpa data seed)
- `apps/api/database/sql/openbk_script.sql` (script pembersihan data, tabel `admins` tetap dipertahankan)

Cara pakai:
1. Import struktur database:

```bash
mysql -u root -p < apps/api/database/sql/openbk_structure.sql
```

2. Jika database sudah ada data lama dan ingin dibersihkan (kecuali `admins`), jalankan:

```bash
mysql -u root -p openbk < apps/api/database/sql/openbk_script.sql
```

## Deploy ke Subdomain Sekolah

Contoh target:
- Frontend: `bk.sekolah.sch.id`
- Backend API: `api.bk.sekolah.sch.id`

Rekomendasi:
- Frontend tetap memanggil `/api/...` (same-origin) lalu diproxy oleh Nginx ke subdomain API.

## 1) Deploy Backend (api.bk.sekolah.sch.id)

Folder app backend: `/var/www/openbk/apps/api`

Contoh Nginx server block API:

```nginx
server {
    listen 80;
    server_name api.bk.sekolah.sch.id;
    root /var/www/openbk/apps/api/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Set `.env` production API:
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://api.bk.sekolah.sch.id`
- DB sesuai server.
- MAIL opsional dan tidak dipakai untuk login admin:
  - `MAIL_MAILER=smtp`
  - `MAIL_HOST=sandbox.smtp.mailtrap.io`
  - `MAIL_PORT=2525`
  - `MAIL_USERNAME=<mailtrap_username>`
  - `MAIL_PASSWORD=<mailtrap_password_or_token>`
  - `MAIL_FROM_ADDRESS=no-reply@sekolah.sch.id`
  - `MAIL_FROM_NAME="Open BK"`
- Jangan hardcode API key/token di source code; simpan di `.env` production.

## 2) Deploy Frontend (bk.sekolah.sch.id)

Copy hasil build frontend ke server:
- `/var/www/openbk/apps/web/dist`

Contoh Nginx server block frontend + proxy API:

```nginx
server {
    listen 80;
    server_name bk.sekolah.sch.id;
    root /var/www/openbk/apps/web/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass https://api.bk.sekolah.sch.id/api/;
        proxy_set_header Host api.bk.sekolah.sch.id;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 3) Aktifkan HTTPS

Setelah DNS aktif, jalankan certbot:

```bash
sudo certbot --nginx -d bk.sekolah.sch.id -d api.bk.sekolah.sch.id
```

## 4) Catatan Deploy Login Admin

### A. Data admin yang wajib tersedia

1. Pastikan setiap akun admin memiliki `username`, `password`, `nip`, dan `full_name`.
2. Buat/buka **Project** untuk Open BK.
3. Buka menu **Email Testing** lalu pilih inbox yang ingin dipakai.
4. Buka tab **SMTP Settings / Integrations**.
5. Copy nilai berikut:
   - `host`
   - `port`
   - `username`
   - `password` (atau token SMTP yang ditampilkan Mailtrap)

### B. Mapping ke `.env` Open BK

Jika Anda tetap memakai email untuk fitur lain, isi `.env` backend (`apps/api/.env`) sesuai kebutuhan layanan email Anda:

```env
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=<mailtrap_username>
MAIL_PASSWORD=<mailtrap_password_or_token>
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=no-reply@sekolah.sch.id
MAIL_FROM_NAME="Open BK"
```

Catatan:
- Flow login admin tidak lagi memakai OTP email atau Mailtrap.
- Simpan credential hanya di `.env`, jangan commit ke repository.

### C. Terapkan dan Verifikasi

1. Reload service PHP-FPM:
   - `sudo systemctl reload php8.2-fpm`
2. Reload Nginx:
   - `sudo systemctl reload nginx`
3. Uji flow token login admin dari halaman login.
4. Pastikan token bisa diverifikasi dan dashboard terbuka.

## 5) Deploy Update Rutin

Contoh urutan update:
1. Pull code terbaru.
2. Backend:
   - `composer install --no-dev --optimize-autoloader`
   - `php artisan migrate --force`
   - `php artisan optimize`
3. Frontend:
   - `npm ci`
   - `npm run build`
4. Reload service:
   - `sudo systemctl reload php8.2-fpm`
   - `sudo systemctl reload nginx`

## Troubleshooting

### 422 Validation Error
- Cek payload JSON dan pastikan field sesuai (misalnya NIS wajib digit, token login admin 6 digit).

### Frontend tidak bisa hit API di production
- Pastikan block `location /api/` di Nginx frontend sudah benar.
- Pastikan API subdomain bisa diakses dan SSL valid.

### Token login admin gagal dibuat
- Pastikan data `nip` dan `full_name` admin sudah benar.
- Pastikan challenge login belum lewat 5 menit.

### Feature test banyak skip
- Aktifkan extension `pdo_sqlite`, atau siapkan konfigurasi test DB MySQL terpisah.

## Lisensi

Internal project sekolah (Open BK).

