import type { RegisterPayload, AuthResult } from "~features/nis-gate/types/nis-gate.types";
import { apiClient } from "~lib/apiClient";

export async function registerNis(payload: RegisterPayload): Promise<AuthResult> {
    return apiClient<AuthResult>("/students/register", {
        method: "POST",
        body: JSON.stringify({
            nis: payload.nis,
            password: payload.passwordHash
        }),
    });
}
