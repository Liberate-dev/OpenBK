import type { AuthResult } from "~features/nis-gate/types/nis-gate.types";
import { apiClient } from "~lib/apiClient";

export async function requestPasswordReset(nis: string): Promise<AuthResult> {
    return apiClient<AuthResult>("/students/request-password-reset", {
        method: "POST",
        body: JSON.stringify({ nis }),
    });
}
