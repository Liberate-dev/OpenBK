<?php

namespace Tests\Feature;

use App\Models\Admin;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminAuthTokenFlowTest extends TestCase
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

    public function test_admin_can_login_with_generated_token_after_identity_validation(): void
    {
        $admin = Admin::create([
            'username' => 'guru.bk',
            'password' => Hash::make('secret123'),
            'role' => 'guru_bk',
            'nip' => '198812312025011001',
            'full_name' => 'Budi Santoso',
        ]);

        $loginResponse = $this->postJson('/api/v1/admin/login', [
            'username' => 'guru.bk',
            'password' => 'secret123',
        ]);

        $loginResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('requires_token', true);

        $generateResponse = $this->postJson('/api/v1/admin/generate-token', [
            'challenge_id' => $loginResponse->json('challenge_id'),
            'challenge_token' => $loginResponse->json('challenge_token'),
            'nip' => '198812312025011001',
            'full_name' => '  budi   santoso ',
        ]);

        $generateResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        $verifyResponse = $this->postJson('/api/v1/admin/verify-token', [
            'challenge_id' => $loginResponse->json('challenge_id'),
            'challenge_token' => $loginResponse->json('challenge_token'),
            'login_token' => $generateResponse->json('generated_token'),
        ]);

        $verifyResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('username', $admin->username)
            ->assertJsonPath('role', $admin->role);
    }

    public function test_generate_token_rejects_invalid_identity_data(): void
    {
        Admin::create([
            'username' => 'admin_it',
            'password' => Hash::make('secret123'),
            'role' => 'admin',
            'nip' => '1987654321',
            'full_name' => 'Admin IT',
        ]);

        $loginResponse = $this->postJson('/api/v1/admin/login', [
            'username' => 'admin_it',
            'password' => 'secret123',
        ]);

        $generateResponse = $this->postJson('/api/v1/admin/generate-token', [
            'challenge_id' => $loginResponse->json('challenge_id'),
            'challenge_token' => $loginResponse->json('challenge_token'),
            'nip' => '1111111111',
            'full_name' => 'Nama Salah',
        ]);

        $generateResponse->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    public function test_verify_token_rejects_expired_generated_token(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-03-19 09:00:00'));

        try {
            Admin::create([
                'username' => 'admin_it',
                'password' => Hash::make('secret123'),
                'role' => 'admin',
                'nip' => '1987654321',
                'full_name' => 'Admin IT',
            ]);

            $loginResponse = $this->postJson('/api/v1/admin/login', [
                'username' => 'admin_it',
                'password' => 'secret123',
            ]);

            $generateResponse = $this->postJson('/api/v1/admin/generate-token', [
                'challenge_id' => $loginResponse->json('challenge_id'),
                'challenge_token' => $loginResponse->json('challenge_token'),
                'nip' => '1987654321',
                'full_name' => 'Admin IT',
            ]);

            Carbon::setTestNow(Carbon::parse('2026-03-19 09:05:01'));

            $verifyResponse = $this->postJson('/api/v1/admin/verify-token', [
                'challenge_id' => $loginResponse->json('challenge_id'),
                'challenge_token' => $loginResponse->json('challenge_token'),
                'login_token' => $generateResponse->json('generated_token'),
            ]);

            $verifyResponse->assertStatus(400)
                ->assertJsonPath('success', false);
        } finally {
            Carbon::setTestNow();
        }
    }
}
