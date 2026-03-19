export interface AdminSession {
    username: string;
    token: string;
    role: 'admin' | 'guru_bk' | 'kepala_sekolah';
    expiresAt: number;
}

export const adminAuthService = {
    getSession: (): AdminSession | null => {
        try {
            const sessionString = sessionStorage.getItem("openbk_admin_session");
            if (!sessionString) return null;

            const session: AdminSession = JSON.parse(sessionString);
            if (Date.now() > session.expiresAt) {
                sessionStorage.removeItem("openbk_admin_session");
                return null;
            }
            return session;
        } catch {
            return null;
        }
    },

    setSession: (session: AdminSession) => {
        sessionStorage.setItem("openbk_admin_session", JSON.stringify(session));
    },

    clearSession: () => {
        sessionStorage.removeItem("openbk_admin_session");
    },

    isAuthenticated: (): boolean => {
        return adminAuthService.getSession() !== null;
    }
};
