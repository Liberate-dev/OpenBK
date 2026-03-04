export interface LoginPayload {
  nis: string;
  passwordHash: string;
}

export interface RegisterPayload {
  nis: string;
  passwordHash: string;
}

export interface AuthResult {
  success: boolean;
  sessionToken?: string;
  message: string;
}

