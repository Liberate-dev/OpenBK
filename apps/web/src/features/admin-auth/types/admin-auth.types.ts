export interface AdminLoginPayload {
    username: string;
    password: string;
}

export interface AdminLoginResult {
    success: boolean;
    token?: string;
    username?: string;
    role?: 'admin' | 'guru_bk' | 'kepala_sekolah';
    message?: string;
    requires_token?: boolean;
    challenge_id?: number;
    challenge_token?: string;
    generated_token?: string;
}
