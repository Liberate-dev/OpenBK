import { apiClient } from "~lib/apiClient";
import type { AdminLoginPayload, AdminLoginResult } from "~features/admin-auth/types/admin-auth.types";

interface AdminAuthApiResponse extends AdminLoginResult {
    token?: string;
    username?: string;
    role?: "admin" | "guru_bk";
    message?: string;
    requires_2fa?: boolean;
    otp_id?: number;
}

export async function adminLogin(payload: AdminLoginPayload): Promise<AdminLoginResult> {
    const rawResult = await apiClient<AdminAuthApiResponse>("/admin/login", {
        method: "POST",
        body: JSON.stringify(payload),
    });

    return {
        success: rawResult.success,
        token: rawResult.token,
        username: rawResult.username,
        role: rawResult.role,
        message: rawResult.message,
        requires_2fa: rawResult.requires_2fa,
        otp_id: rawResult.otp_id,
    }
}

export async function adminVerifyOtp(payload: { otp_id: number; otp_code: string }): Promise<AdminLoginResult> {
    const rawResult = await apiClient<AdminAuthApiResponse>("/admin/verify-otp", {
        method: "POST",
        body: JSON.stringify(payload),
    });

    return {
        success: rawResult.success,
        token: rawResult.token,
        username: rawResult.username,
        role: rawResult.role,
        message: rawResult.message,
    }
}
