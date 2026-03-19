const STORAGE_KEY = 'openbk_public_report_session';

export interface PublicReportSession {
  token: string;
  expiresAt: string;
  reporter: {
    nip: string;
    aliasName: string;
    description?: string | null;
  };
}

function readSession(): PublicReportSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PublicReportSession;

    if (!parsed?.token || !parsed?.expiresAt || !parsed?.reporter?.nip || !parsed?.reporter?.aliasName) {
      return null;
    }

    if (Date.now() >= Date.parse(parsed.expiresAt)) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export const publicReportSessionService = {
  getSession(): PublicReportSession | null {
    return readSession();
  },
  saveSession(session: PublicReportSession) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  },
  clearSession() {
    sessionStorage.removeItem(STORAGE_KEY);
  },
  isAuthenticated(): boolean {
    return readSession() !== null;
  },
};
