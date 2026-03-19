import { useMutation } from "@tanstack/react-query";
import type { AuthResult } from "~features/nis-gate/types/nis-gate.types";
import { requestPasswordReset } from "~features/nis-gate/api/requestPasswordReset";

export function useRequestPasswordReset() {
    return useMutation<AuthResult, Error, string>({
        mutationFn: requestPasswordReset,
    });
}
