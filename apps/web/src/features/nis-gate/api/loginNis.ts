import type { LoginPayload, AuthResult } from "~features/nis-gate/types/nis-gate.types";
import { apiClient } from "~lib/apiClient";

export async function loginNis(payload: LoginPayload): Promise<AuthResult> {
    return apiClient<AuthResult>("/students/login", {
        method: "POST",
        body: JSON.stringify({
            nis: payload.nis,
            password: payload.passwordHash
        }),
    });
}
