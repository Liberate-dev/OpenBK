# Open BK — Technical Documentation

## Overview

Open BK is a school counseling (Bimbingan Konseling) platform with two sides:
- **Students**: login via NIS, send confidential letters, read replies, view repository.
- **Admins/Guru BK**: triage letters by risk score, reply, manage counseling records, administer the system.

## Tech Stack

### Backend (`apps/api`)
- Laravel 12 (PHP 8.2+)
- Laravel Sanctum (token auth)
- MySQL 8+ / MariaDB 10.6+ (production), SQLite in-memory (testing)
- REST API with `v1` versioned routes

### Frontend (`apps/web`)
- React 19 + TypeScript
- Vite
- TanStack Router (file-based routing, code-split)
- TanStack Query (suspense-first data fetching)
- MUI v7 (Material UI)
- Framer Motion (animations)

## Architecture

```
Open BK/
├── apps/
│   ├── api/          # Laravel 12 API backend
│   │   ├── app/
│   │   │   ├── Http/Controllers/Api/   # 11 controllers
│   │   │   ├── Models/                  # 11 models
│   │   │   └── Middleware/
│   │   ├── database/migrations/         # 24 migration files
│   │   ├── routes/api.php               # API route definitions
│   │   └── .env.example
│   │
│   └── web/          # React 19 frontend
│       ├── src/
│       │   ├── routes/           # TanStack Router file-based routes
│       │   ├── features/         # Feature folders (admin-*, student-, nis-gate-)
│       │   ├── components/       # Shared components
│       │   ├── providers/
│       │   ├── hooks/
│       │   └── lib/
│       └── package.json
├── README.md
└── TECHNICAL_DOCS.md (this file)
```

## Authentication Flows

### Student Auth
1. **Register**: POST `/api/v1/students/register` with `nis` + `password`. NIS validated against `allowed_nis` whitelist. Returns Sanctum token.
2. **Login**: POST `/api/v1/students/login` with `nis` + `password`. Returns Sanctum token.
3. **Password Reset Request**: POST `/api/v1/students/request-password-reset` with `nis`. Admin resets via `/admin/students/{id}/reset-password`, student forced to create new password on next signup.
4. All student routes prefixed under `auth:sanctum` middleware.

### Admin Auth (2-step token-based)
1. **Primary**: POST `/api/v1/admin/login` with `username` + `password`. Validates credentials + checks NIP/full_name present. Returns `challenge_token` (valid 5 min).
2. **Secondary**: POST `/api/v1/admin/generate-token` with `challenge_token` + admin identifier (NIP/Full name). Generates `login_token`.
3. **Verify**: POST `/api/v1/admin/verify-token` with `login_token`. Returns Sanctum auth token.
4. All admin routes under `auth:sanctum` middleware with role checks (`guru_bk`, `kepala_sekolah`, `guru`, `admin`).

## API Endpoints

Prefix: `/api/v1`

### Public Routes
| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| POST | `/students/register` | StudentAuthController | Student registration (NIS whitelist check) |
| POST | `/students/login` | StudentAuthController | Student login |
| POST | `/students/request-password-reset` | StudentAuthController | Request password reset |
| POST | `/admin/login` | AdminAuthController | Step 1 admin auth |
| POST | `/admin/generate-token` | AdminAuthController | Step 2 admin auth |
| POST | `/admin/verify-token` | AdminAuthController | Step 3 admin auth |
| GET | `/student/repository/{id}/download` | RepositoryController | Download repo item (any auth) |
| GET | `/admin/repository/{id}/download` | RepositoryController | Download repo item (any auth) |

### Student-Protected Routes (`auth:sanctum`)
| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| POST | `/messages` | MessageController | Submit new letter |
| GET | `/messages/history` | MessageController | Student's letter history |
| POST | `/messages/{referenceId}/reply` | MessageController | Reply to own letter thread |
| GET | `/student/repository` | RepositoryController | Browse public repository items |

### Guru BK Routes (role: guru_bk, guru)
| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| GET | `/admin/messages` | MessageController | Inbox (all letters) |
| GET | `/admin/messages/{referenceId}` | MessageController | Letter detail |
| POST | `/admin/messages/{referenceId}/reply` | MessageController | Reply to student letter |
| GET | `/admin/repository` | RepositoryController | Manage repository items |
| POST | `/admin/repository` | RepositoryController | Create repository item |
| PUT | `/admin/repository/{id}` | RepositoryController | Update repository item |
| DELETE | `/admin/repository/{id}` | RepositoryController | Delete repository item |
| GET | `/admin/student-profiles` | StudentProfileController | List students |
| PUT | `/admin/student-profiles/{id}` | StudentProfileController | Update student profile |
| GET | `/admin/counseling-records` | CounselingRecordController | Counseling records list |
| POST | `/admin/counseling-records` | CounselingRecordController | Create record |
| PUT | `/admin/counseling-records/{id}` | CounselingRecordController | Update record |
| DELETE | `/admin/counseling-records/{id}` | CounselingRecordController | Delete record |
| GET | `/admin/dashboard-summary` | CounselingReportController | Dashboard stats |
| GET | `/admin/reports/summary` | CounselingReportController | Reports summary |
| GET | `/admin/reports/export` | CounselingReportController | Export reports |
| POST | `/admin/guru/reports` | GuruReportController | Guru submits behavioral report |
| GET | `/admin/guru/repository` | RepositoryController | Public repository for guru |

### Admin IT Routes (role: admin)
| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| GET | `/admin/users` | AdminManagementController | List admin users |
| POST | `/admin/users` | AdminManagementController | Create admin user |
| PUT | `/admin/users/{id}` | AdminManagementController | Update admin user |
| DELETE | `/admin/users/{id}` | AdminManagementController | Delete admin user |
| GET | `/admin/logs` | AdminManagementController | Activity logs |
| GET | `/admin/students` | AdminManagementController | List students |
| GET | `/admin/student-reset-requests` | AdminManagementController | Pending password reset requests |
| POST | `/admin/students/{id}/reset-password` | AdminManagementController | Force password reset |
| GET | `/admin/nis` | AllowedNisController | Whitelist NIS list |
| POST | `/admin/nis` | AllowedNisController | Add NIS |
| POST | `/admin/nis/import` | AllowedNisController | Bulk import CSV/XLSX |
| PUT | `/admin/nis/{id}` | AllowedNisController | Update NIS entry |
| DELETE | `/admin/nis/{id}` | AllowedNisController | Delete NIS entry |
| GET | `/admin/risk-dictionary` | RiskDictionaryController | Risk keyword dictionary |
| POST | `/admin/risk-dictionary` | RiskDictionaryController | Add risk keyword |
| PUT | `/admin/risk-dictionary/{id}` | RiskDictionaryController | Update keyword |
| DELETE | `/admin/risk-dictionary/{id}` | RiskDictionaryController | Delete keyword |

## Database Structure

### Tables

#### `admins`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | |
| username | VARCHAR(50) | Unique, alphanumeric + _.- |
| password | VARCHAR(255) | Bcrypt hashed |
| role | ENUM('admin','guru_bk','kepala_sekolah','guru') | Role-based access |
| email | VARCHAR(255) | Nullable |
| nip | VARCHAR(50) | Required for token auth |
| full_name | VARCHAR(255) | Required for token auth |
| login_challenge_hash | VARCHAR(255) | 2nd factor challenge |
| login_challenge_expires_at | DATETIME | Challenge TTL (5 min) |
| login_token_hash | VARCHAR(255) | Generated login token hash |
| login_token_expires_at | DATETIME | Token TTL |
| created_at / updated_at | TIMESTAMP | |

#### `students`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | |
| nis | VARCHAR(12) | Unique, numeric |
| password | VARCHAR(255) | Nullable (forced on admin reset) |
| password_reset_required | BOOLEAN | Flags forced password creation |
| created_at / updated_at | TIMESTAMP | |

#### `allowed_nis` (Whitelist)
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | |
| nis | VARCHAR(12) | Unique, enrolled student ID |
| name | VARCHAR(255) | Full name |
| class_name | VARCHAR(50) | Class assignment |
| profile_summary | TEXT | Student profile summary |
| character_notes | TEXT | Character notes for counselors |
| created_at / updated_at | TIMESTAMP | |

#### `messages`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | |
| reference_id | VARCHAR(30) | Unique thread identifier |
| student_id | BIGINT FK | References students.id |
| body | TEXT | Letter content |
| risk_level | ENUM('low','medium','high','critical') | Auto-scored |
| risk_score | INT | Computed from risk dictionary |
| risk_tags | JSON | Array of matched keywords |
| is_read | BOOLEAN | Read receipt |
| created_at / updated_at | TIMESTAMP | |

#### `replies`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | |
| message_id | BIGINT FK | References messages.id (thread parent) |
| admin_id | BIGINT FK | Nullable (student replies have admin_id=NULL) |
| student_id | BIGINT FK | Who authored the reply |
| body | TEXT | Reply content |
| created_at / updated_at | TIMESTAMP | |

#### `counseling_records`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | |
| allowed_nis_id | BIGINT FK | References allowed_nis.id |
| session_date | DATE | |
| start_time / end_time | TIME | |
| service_type | VARCHAR(50) | Individual/group/calling/etc. |
| medium | VARCHAR(50) | Direct/conference/etc. |
| location | VARCHAR(255) | |
| topic | TEXT | Counseling topic |
| objective | TEXT | Goal |
| assessment | TEXT | Counselor assessment |
| intervention | TEXT | Intervention applied |
| result_summary | TEXT | Outcome |
| follow_up_plan | TEXT | Next steps |
| status | ENUM(...) | current/done |
| next_follow_up_date | DATE | |
| created_by_admin_id | BIGINT FK | Counselor ID |
| created_at / updated_at | TIMESTAMP | |

#### `guru_reports`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | |
| reference_id | VARCHAR(30) | Unique |
| admin_id | BIGINT FK | Reporting teacher |
| reporter_nip | VARCHAR(50) | Teacher NIP |
| reporter_alias | VARCHAR(255) | Teacher alias/name |
| student_name | VARCHAR(255) | Reported student |
| student_class | VARCHAR(50) | |
| student_nis | VARCHAR(12) | |
| summary | TEXT | Brief description |
| body | TEXT | Detailed report |
| risk_level | ENUM('low','medium','high','critical') | |
| risk_score | INT | |
| risk_tags | JSON | Array |
| is_read | BOOLEAN | Read receipt |
| created_at / updated_at | TIMESTAMP | |

#### `repository_items`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | |
| title | VARCHAR(255) | |
| category | VARCHAR(50) | Study/life/career |
| summary | TEXT | Brief description |
| content | LONGTEXT | Full content or URL |
| link_url | VARCHAR(500) | External link |
| visibility | ENUM('public','admin_only') | Access control |
| file_path | VARCHAR(500) | Uploaded file |
| file_original_name | VARCHAR(255) | Original filename |
| file_size | INT | Bytes |
| created_by_admin_id | BIGINT FK | |
| created_at / updated_at | TIMESTAMP | |

#### `risk_dictionaries`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | |
| word | VARCHAR(100) | Keyword |
| risk_level | ENUM('low','medium','high','critical') | Severity |
| weight | INT | Score contribution |

#### `student_password_reset_requests`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | |
| student_id | BIGINT FK | |
| nis | VARCHAR(12) | Denormalized for lookup |
| status | ENUM('pending','resolved') | |
| resolved_by_admin_id | BIGINT FK | Admin who resolved |
| resolved_at | DATETIME | |
| created_at / updated_at | TIMESTAMP | |

#### `activity_logs`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | |
| admin_id | BIGINT FK | |
| action | VARCHAR(100) | Logged action |
| description | TEXT | Detail |
| ip_address | VARCHAR(45) | Client IP |
| created_at / updated_at | TIMESTAMP | |

#### `cache`, `jobs`, `sessions`, `personal_access_tokens`
Standard Laravel tables.

## Core Features

### Risk Scoring Engine
When a student sends a letter, the `body` is scanned against `risk_dictionaries`. Matches sum weights to produce `risk_score`. Based on score, `risk_level` is assigned:
- 0-3: `low`
- 4-7: `medium`  
- 8-12: `high`
- 13+: `critical`

Same scoring applies to `guru_reports`.

### Letter Thread Model
Messages use a `reference_id` for threading. Students and admins reply within the same thread via `replies` table (polymorphic `admin_id`/`student_id`).

### Repository
Admins publish study materials, career info, or life skills content. Items can be `public` or `admin_only`. Students browse by category; everyone can download files.

### Guru Report
Teachers report student behavioral concerns. Submitted via POST `/admin/guru/reports` under auth. Goes into admin inbox for counselor follow-up.

## Frontend Routes

```
/                     Landing page (role selection: Student or Admin)
/student              Student portal
/student/             Student dashboard
/student/send-letter  Compose new letter
/student/repository   Browse repository
/my-letters           Letter history + threads
/admin                Admin portal
/admin/login          Admin 2-step login
/admin/               Admin dashboard (summary)
/admin/inbox          Message inbox (priority-sorted by risk)
/admin/guru-report    Guru submission form
/admin/counseling     Counseling records management
/admin/reports        Analytics & exports
/admin/repository     Repository management
/admin/users          User management (admin IT only)
/admin/students       Student management
/admin/student-profiles Student profile editor
/admin/nis            NIS whitelist management
/admin/kamus          Risk dictionary management
/admin/logs           Activity audit log
```

## Running Locally

### Prerequisites
- Node.js 20+, npm 10+
- PHP 8.2+, Composer
- MySQL 8+ or MariaDB 10.6+

### Backend
```bash
cd apps/api
composer install
cp .env.example .env
php artisan key:generate
# Edit .env: set DB credentials
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8000
```

API base: `http://127.0.0.1:8000/api/v1/`

### Frontend
```bash
cd apps/web
npm install
npm run dev
```

Frontend: `http://127.0.0.1:3000`
Vite proxies `/api` to backend port 8000.

### Default Dev Accounts
| Role | Username | Password | NIP |
|------|----------|----------|-----|
| Admin IT | `admin` | `rahasiabk` | `198001012005011001` |
| Guru BK | `guru_bk` | `gurubk123` | `198502142010012003` |

Whitelist NIS seeds: `123456`, `654321`, `111111`, `222222`, `333333`

### Tests
```bash
# Backend
cd apps/api
php artisan test
./vendor/bin/pint --test

# Frontend
cd apps/web
npm run lint
npm run typecheck
npm run build
```

## Deployment

### Docker
```bash
docker compose up --build
# Frontend: http://localhost:8080
# API direct: http://localhost:8000
# MySQL: localhost:3307
```

### Subdomain Production
- Frontend: `bk.sekolah.sch.id` (Nginx serves `dist/`, proxies `/api/` to backend)
- Backend: `api.bk.sekolah.sch.id` (PHP-FPM 8.2 + Nginx)
- HTTPS via Certbot

### Deploy Sequence
```bash
# Backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan optimize

# Frontend
npm ci && npm run build

# Reload
systemctl reload php8.2-fpm
systemctl reload nginx
```

## Security
- Laravel Sanctum SPA token auth
- bcrypt password hashing (12 rounds)
- Input validation via Laravel form requests (regex on NIS, username, body)
- Eloquent ORM only (no raw SQL with user input)
- Role-based route groups
- Reference ID pattern constrained (`[A-Za-z0-9-]{1,30}`)
- 2-step admin auth with TTL-limited challenge tokens
