import { apiClient } from "~lib/apiClient";
import type { AdminLoginPayload, AdminLoginResult } from "~features/admin-auth/types/admin-auth.types";

interface AdminAuthApiResponse extends AdminLoginResult {
    token?: string;
    username?: string;
    role?: "admin" | "guru_bk" | "kepala_sekolah";
    message?: string;
    requires_token?: boolean;
    challenge_id?: number;
    challenge_token?: string;
    generated_token?: string;
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
        requires_token: rawResult.requires_token,
        challenge_id: rawResult.challenge_id,
        challenge_token: rawResult.challenge_token,
    };
}

export async function adminGenerateToken(payload: {
    challenge_id: number;
    challenge_token: string;
    nip: string;
    full_name: string;
}): Promise<AdminLoginResult> {
    const rawResult = await apiClient<AdminAuthApiResponse>("/admin/generate-token", {
        method: "POST",
        body: JSON.stringify(payload),
    });

    return {
        success: rawResult.success,
        message: rawResult.message,
        generated_token: rawResult.generated_token,
    };
}

export async function adminVerifyToken(payload: {
    challenge_id: number;
    challenge_token: string;
    login_token: string;
}): Promise<AdminLoginResult> {
    const rawResult = await apiClient<AdminAuthApiResponse>("/admin/verify-token", {
        method: "POST",
        body: JSON.stringify(payload),
    });

    return {
        success: rawResult.success,
        token: rawResult.token,
        username: rawResult.username,
        role: rawResult.role,
        message: rawResult.message,
    };
}
