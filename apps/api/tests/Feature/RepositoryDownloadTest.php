<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\RepositoryItem;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RepositoryDownloadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        $defaultConnection = env('DB_CONNECTION', 'sqlite');

        if (
            $defaultConnection === 'sqlite' &&
            ! in_array('sqlite', \PDO::getAvailableDrivers(), true)
        ) {
            $this->markTestSkipped('SQLite driver is not available in this environment.');
        }

        parent::setUp();
        Storage::fake('local');
    }

    public function test_admin_can_download_private_repository_file_using_query_token(): void
    {
        $admin = Admin::create([
            'username' => 'guru.bk',
            'password' => Hash::make('secret123'),
            'role' => 'guru_bk',
            'nip' => '198812312025011001',
            'full_name' => 'Budi Santoso',
        ]);

        Storage::disk('local')->put('repository/panduan-bk.pdf', 'dokumen rahasia');

        $item = RepositoryItem::create([
            'title' => 'Panduan BK Internal',
            'category' => 'repository',
            'summary' => 'Dokumen internal guru BK.',
            'content' => 'Isi dokumen internal.',
            'visibility' => 'private',
            'file_path' => 'repository/panduan-bk.pdf',
            'file_original_name' => 'panduan-bk.pdf',
            'file_size' => strlen('dokumen rahasia'),
            'created_by_admin_id' => $admin->id,
        ]);

        $token = $admin->createToken('admin-token')->plainTextToken;

        $response = $this->get("/api/v1/admin/repository/{$item->id}/download?token={$token}");

        $response->assertOk();
        $response->assertHeader('content-disposition', 'attachment; filename=panduan-bk.pdf');
    }

    public function test_download_without_token_returns_json_unauthorized_instead_of_redirecting(): void
    {
        $admin = Admin::create([
            'username' => 'guru.bk',
            'password' => Hash::make('secret123'),
            'role' => 'guru_bk',
            'nip' => '198812312025011001',
            'full_name' => 'Budi Santoso',
        ]);

        Storage::disk('local')->put('repository/panduan-bk.pdf', 'dokumen rahasia');

        $item = RepositoryItem::create([
            'title' => 'Panduan BK Internal',
            'category' => 'repository',
            'summary' => 'Dokumen internal guru BK.',
            'content' => 'Isi dokumen internal.',
            'visibility' => 'private',
            'file_path' => 'repository/panduan-bk.pdf',
            'file_original_name' => 'panduan-bk.pdf',
            'file_size' => strlen('dokumen rahasia'),
            'created_by_admin_id' => $admin->id,
        ]);

        $response = $this->getJson("/api/v1/admin/repository/{$item->id}/download");

        $response->assertStatus(401)
            ->assertJsonPath('message', 'Unauthorized.');
    }

    public function test_student_query_token_cannot_download_private_repository_file(): void
    {
        $admin = Admin::create([
            'username' => 'guru.bk',
            'password' => Hash::make('secret123'),
            'role' => 'guru_bk',
            'nip' => '198812312025011001',
            'full_name' => 'Budi Santoso',
        ]);

        $student = Student::create([
            'nis' => '12345678',
            'password' => Hash::make('secret123'),
            'password_reset_required' => false,
        ]);

        Storage::disk('local')->put('repository/panduan-bk.pdf', 'dokumen rahasia');

        $item = RepositoryItem::create([
            'title' => 'Panduan BK Internal',
            'category' => 'repository',
            'summary' => 'Dokumen internal guru BK.',
            'content' => 'Isi dokumen internal.',
            'visibility' => 'private',
            'file_path' => 'repository/panduan-bk.pdf',
            'file_original_name' => 'panduan-bk.pdf',
            'file_size' => strlen('dokumen rahasia'),
            'created_by_admin_id' => $admin->id,
        ]);

        $token = $student->createToken('student-token')->plainTextToken;

        $response = $this->getJson("/api/v1/student/repository/{$item->id}/download?token={$token}");

        $response->assertStatus(403)
            ->assertJsonPath('message', 'Akses ditolak.');
    }
}
