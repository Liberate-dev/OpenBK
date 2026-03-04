import { useMutation } from "@tanstack/react-query";
import { registerNis } from "~features/nis-gate/api/registerNis";
import type {
    RegisterPayload,
    AuthResult
} from "~features/nis-gate/types/nis-gate.types";

export function useRegisterNis() {
    return useMutation<AuthResult, Error, RegisterPayload>({
        mutationFn: registerNis
    });
}
