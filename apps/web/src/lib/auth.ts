export const AUTH_STORAGE_KEY = "openbk_student_session";
export const USERS_DB_KEY = "openbk_students_db";

export interface StudentSession {
  nis: string;
  token: string;
  expiresAt: number;
}

// Very basic mock of a user record
export interface StudentRecord {
  nis: string;
  passwordHash: string; // In real app, this is heavily hashed
}

export const authService = {
  // Simulate a database of registered users
  _getUsersDb: (): Record<string, StudentRecord> => {
    try {
      const stored = localStorage.getItem(USERS_DB_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  _saveUsersDb: (db: Record<string, StudentRecord>) => {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
  },

  registerUser: (nis: string, passwordHash: string): boolean => {
    const db = authService._getUsersDb();
    if (db[nis]) {
      return false; // Already registered
    }
    db[nis] = { nis, passwordHash };
    authService._saveUsersDb(db);
    return true;
  },

  verifyCredentials: (nis: string, passwordHash: string): boolean => {
    const db = authService._getUsersDb();
    const user = db[nis];
    return user !== undefined && user.passwordHash === passwordHash;
  },

  getSession: (): StudentSession | null => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return null;
      const session = JSON.parse(stored) as StudentSession;
      if (Date.now() > session.expiresAt) {
        authService.clearSession();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  setSession: (session: StudentSession) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  },

  clearSession: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  isAuthenticated: (): boolean => {
    return authService.getSession() !== null;
  }
};
