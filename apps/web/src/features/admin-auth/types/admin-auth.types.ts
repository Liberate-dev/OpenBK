export interface AdminLoginPayload {
    username: string;
    password?: string;
    otp_code?: string;
    otp_id?: number;
}

export interface AdminLoginResult {
    success: boolean;
    token?: string;
    username?: string;
    role?: 'admin' | 'guru_bk';
    message?: string;
    // 2FA fields
    requires_2fa?: boolean;
    otp_id?: number;
}
