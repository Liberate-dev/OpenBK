<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InputValidationAndAccessControlTest extends TestCase
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
    }

    public function test_student_login_rejects_invalid_nis_format(): void
    {
        $response = $this->postJson('/api/v1/students/login', [
            'nis' => '12ab',
            'password' => 'secret123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nis']);
    }

    public function test_student_token_cannot_access_admin_risk_dictionary_endpoint(): void
    {
        $student = Student::create([
            'nis' => '12345678',
            'password' => Hash::make('secret123'),
            'password_reset_required' => false,
        ]);

        Sanctum::actingAs($student);

        $response = $this->postJson('/api/v1/admin/risk-dictionary', [
            'word' => 'krisis',
            'risk_level' => 'high',
            'weight' => 8,
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_token_cannot_access_student_message_submit_endpoint(): void
    {
        $admin = Admin::create([
            'username' => 'admin_it',
            'password' => Hash::make('secret123'),
            'role' => 'admin',
            'email' => 'admin@example.com',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/messages', [
            'message' => 'Ini contoh pesan siswa yang panjangnya lebih dari sepuluh karakter.',
        ]);

        $response->assertStatus(403);
    }

    public function test_allowed_nis_store_rejects_non_numeric_nis(): void
    {
        $admin = Admin::create([
            'username' => 'admin_it',
            'password' => Hash::make('secret123'),
            'role' => 'admin',
            'email' => 'admin@example.com',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/admin/nis', [
            'nis' => 'ABC-123',
            'name' => 'Siswa Test',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nis']);
    }
}
