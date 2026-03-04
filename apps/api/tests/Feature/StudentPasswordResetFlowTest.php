<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\AllowedNis;
use App\Models\Message;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StudentPasswordResetFlowTest extends TestCase
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

    public function test_student_can_signup_again_after_admin_reset_without_losing_message_data(): void
    {
        AllowedNis::create([
            'nis' => '12345678',
            'name' => 'Siswa Test',
        ]);

        $student = Student::create([
            'nis' => '12345678',
            'password' => Hash::make('old-password'),
            'password_reset_required' => true,
        ]);

        Message::create([
            'reference_id' => 'ltr-reset-flow-001',
            'student_id' => $student->id,
            'body' => 'Pesan lama siswa yang harus tetap ada setelah reset password.',
            'risk_level' => 'low',
            'risk_score' => 1,
            'risk_tags' => [],
            'is_read' => false,
        ]);

        $response = $this->postJson('/api/v1/students/register', [
            'nis' => '12345678',
            'password' => 'new-password',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['sessionToken']);

        $updatedStudent = Student::where('nis', '12345678')->firstOrFail();

        $this->assertSame($student->id, $updatedStudent->id, 'Student row must be reused, not recreated.');
        $this->assertFalse($updatedStudent->password_reset_required);
        $this->assertTrue(Hash::check('new-password', $updatedStudent->password));
        $this->assertSame(1, Message::where('student_id', $updatedStudent->id)->count(), 'Student messages must remain intact.');
    }

    public function test_student_login_is_blocked_when_reset_required(): void
    {
        $student = Student::create([
            'nis' => '87654321',
            'password' => Hash::make('password-123'),
            'password_reset_required' => true,
        ]);

        $response = $this->postJson('/api/v1/students/login', [
            'nis' => $student->nis,
            'password' => 'password-123',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_admin_can_reset_student_password_and_invalidate_tokens(): void
    {
        $admin = Admin::create([
            'username' => 'admin_it',
            'password' => Hash::make('secret123'),
            'role' => 'admin',
            'email' => 'admin@example.com',
        ]);

        $student = Student::create([
            'nis' => '99887766',
            'password' => Hash::make('active-password'),
            'password_reset_required' => false,
        ]);

        $student->createToken('student-token');
        $this->assertSame(1, $student->tokens()->count());

        Sanctum::actingAs($admin);

        $response = $this->postJson("/api/v1/admin/students/{$student->id}/reset-password");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $student->refresh();
        $this->assertTrue($student->password_reset_required);
        $this->assertFalse(Hash::check('active-password', $student->password));
        $this->assertSame(0, $student->tokens()->count(), 'Student tokens must be revoked after admin reset.');

        $studentsResponse = $this->getJson('/api/v1/admin/students');
        $studentsResponse->assertStatus(200)
            ->assertJsonFragment([
                'id' => $student->id,
                'nis' => $student->nis,
                'status' => 'reset_required',
                'canLogin' => false,
            ]);
    }
}
