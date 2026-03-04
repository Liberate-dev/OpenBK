import { useMutation } from "@tanstack/react-query";
import { sendLetter } from "~features/send-letter/api/sendLetter";
import type {
  SendLetterPayload,
  SendLetterResult
} from "~features/send-letter/types/send-letter.types";

export function useSendLetter() {
  return useMutation<SendLetterResult, Error, SendLetterPayload>({
    mutationFn: sendLetter
  });
}
