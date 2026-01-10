export const ADMIN_TOKEN_KEY = 'admin_token';

export const getAdminToken = (): string | null => {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY);
};

export const setAdminToken = (token: string, remember: boolean) => {
    if (remember) {
        localStorage.setItem(ADMIN_TOKEN_KEY, token);
        sessionStorage.removeItem(ADMIN_TOKEN_KEY); // clean up session if moving to local
    } else {
        sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
        localStorage.removeItem(ADMIN_TOKEN_KEY); // clean up local if moving to session
    }
};

export const clearAdminToken = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
};

export const getAuthHeaders = (token?: string | null): Record<string, string> => {
    const t = token ?? getAdminToken();
    if (t) {
        return { 'x-admin-token': t };
    }
    return {};
};
