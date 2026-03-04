export interface SendLetterPayload {
  message: string;
}

export interface SendLetterResult {
  accepted: boolean;
  referenceId: string;
}

