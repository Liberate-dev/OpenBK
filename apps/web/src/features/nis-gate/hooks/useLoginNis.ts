import { useMutation } from "@tanstack/react-query";
import { loginNis } from "~features/nis-gate/api/loginNis";
import type {
    LoginPayload,
    AuthResult
} from "~features/nis-gate/types/nis-gate.types";

export function useLoginNis() {
    return useMutation<AuthResult, Error, LoginPayload>({
        mutationFn: loginNis
    });
}
