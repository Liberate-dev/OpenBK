import type {
  SendLetterPayload,
  SendLetterResult
} from "~features/send-letter/types/send-letter.types";
import { apiClient } from "~lib/apiClient";

export async function sendLetter(payload: SendLetterPayload): Promise<SendLetterResult> {
  return apiClient<SendLetterResult>("/messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

