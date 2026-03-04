export interface AdminSession {
    username: string;
    token: string;
    role: 'admin' | 'guru_bk';
    expiresAt: number;
}

export const adminAuthService = {
    getSession: (): AdminSession | null => {
        try {
            const sessionString = localStorage.getItem("openbk_admin_session");
            if (!sessionString) return null;

            const session: AdminSession = JSON.parse(sessionString);
            if (Date.now() > session.expiresAt) {
                localStorage.removeItem("openbk_admin_session");
                return null;
            }
            return session;
        } catch {
            return null;
        }
    },

    setSession: (session: AdminSession) => {
        localStorage.setItem("openbk_admin_session", JSON.stringify(session));
    },

    clearSession: () => {
        localStorage.removeItem("openbk_admin_session");
    },

    isAuthenticated: (): boolean => {
        return adminAuthService.getSession() !== null;
    }
};
