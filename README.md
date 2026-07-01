# Open BK

Platform Bimbingan Konseling (BK) untuk sekolah. Surat curhat siswa dianalisis otomatis, guru BK triase berdasarkan skor risiko, admin IT mengelola keseluruhan sistem.

## Fitur Utama

### Siswa
- Login/signup via NIS (tervalidasi whitelist sekolah)
- Kirim surat curhat dengan analisis risiko otomatis
- Thread reply untuk komunikasi berbalas
- Akses repository materi belajar/karir

### Guru BK
- Inbox prioritaskan surat berdasarkan level risiko
- Reply dalam thread yang sama
- Kelola counseling records (sesi, penilaian, tindak lanjut)
- Submit guru report (laporan perilaku siswa)
- Dashboard ringkasan & export laporan

### Admin IT
- Manajemen user admin/guru/kepala sekolah
- Manajemen siswa & reset password paksa
- Whitelist NIS (manual + bulk import)
- Kamus risiko (kata kunci + bobot scoring)
- Activity audit log
- Kelola repository & counseling records

## Quick Start

```bash
# Backend
cd apps/api
composer install && cp .env.example .env && php artisan key:generate
# edit .env untuk DB MySQL
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8000

# Frontend
cd apps/web
npm install && npm run dev
```

- Frontend: `http://localhost:3000`
- API: `http://127.0.0.1:8000/api/v1/`

Default akun dev: `admin`/`rahasiabk` (Admin IT), `guru_bk`/`gurubk123` (Guru BK).

## Dokumentasi Lengkap

- [Installation, Deployment, Architecture, DB Schema](./TECHNICAL_DOCS.md)
- [ERD / Entity Relationship](./ERD.md)
- [Test Scenarios](./FLOW_SCENARIOS.md)
- [Testing Guide](./TESTING_GUIDE.md)

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, TanStack Router, TanStack Query, MUI v7, Framer Motion |
| Backend | Laravel 12, PHP 8.2+, Laravel Sanctum, REST API v1 |
| Database | MySQL 8+ / MariaDB 10.6+ (production), SQLite in-memory (test) |
| Infra | Nginx, PHP-FPM 8.2, Docker Compose, Let's Encrypt |

## Project Structure

```
Open BK/
├── apps/
│   ├── api/     # Laravel 12 REST API (11 controllers, 11 models, 24 migrations)
│   └── web/     # React 19 SPA (TanStack Router, MUI v7)
├── TECHNICAL_DOCS.md
├── README.md
└── docker-compose.yml
```

## Deployment

See [TECHNICAL_DOCS.md#deployment](./TECHNICAL_DOCS.md#deployment) for full nginx configs, subdomain setup, and SSL.

```bash
# Docker (quick)
docker compose up --build

# Production sequence
cd apps/api && composer install --no-dev --optimize-autoloader && php artisan migrate --force
cd apps/web && npm ci && npm run build
```

## License

Internal school project (Open BK).
