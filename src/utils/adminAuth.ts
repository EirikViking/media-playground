export const ADMIN_TOKEN_KEY = 'admin_token';

const getStorage = (type: 'local' | 'session'): Storage | null => {
    if (typeof window === 'undefined') return null;
    return type === 'local' ? window.localStorage : window.sessionStorage;
};

const safeGetItem = (storage: Storage | null, key: string): string | null => {
    if (!storage) return null;
    try {
        return storage.getItem(key);
    } catch {
        return null;
    }
};

const safeSetItem = (storage: Storage | null, key: string, value: string) => {
    if (!storage) return;
    try {
        storage.setItem(key, value);
    } catch {
        // ignore storage errors (private mode/quota)
    }
};

const safeRemoveItem = (storage: Storage | null, key: string) => {
    if (!storage) return;
    try {
        storage.removeItem(key);
    } catch {
        // ignore storage errors (private mode/quota)
    }
};

export const getAdminToken = (): string | null => {
    return safeGetItem(getStorage('local'), ADMIN_TOKEN_KEY) || safeGetItem(getStorage('session'), ADMIN_TOKEN_KEY);
};

export const setAdminToken = (token: string, remember: boolean) => {
    if (remember) {
        safeSetItem(getStorage('local'), ADMIN_TOKEN_KEY, token);
        safeRemoveItem(getStorage('session'), ADMIN_TOKEN_KEY); // clean up session if moving to local
    } else {
        safeSetItem(getStorage('session'), ADMIN_TOKEN_KEY, token);
        safeRemoveItem(getStorage('local'), ADMIN_TOKEN_KEY); // clean up local if moving to session
    }
};

export const clearAdminToken = () => {
    safeRemoveItem(getStorage('local'), ADMIN_TOKEN_KEY);
    safeRemoveItem(getStorage('session'), ADMIN_TOKEN_KEY);
};

export const getAuthHeaders = (token?: string | null): Record<string, string> => {
    const t = token ?? getAdminToken();
    if (t) {
        return { 'x-admin-token': t };
    }
    return {};
};
