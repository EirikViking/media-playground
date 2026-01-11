
/**
 * Local State Management for Permission-less Personalization
 * Stores non-sensitive preferences and usage patterns in localStorage
 */

export interface UserState {
    lastVisitedSection: string;
    lastActiveHomeTile: string;
    tileClicksCount: Record<string, number>;
    lastUploadAt: string | null;
    lastAdminTab: string;
    dismissedNotices: Record<string, number>; // id -> timestamp
    sessionsCount: number;
    firstSeenAt: string;
    hasSeenStudioTooltip: boolean;
}

const STORAGE_KEY = 'mp_state_v1';

const defaultState: UserState = {
    lastVisitedSection: '/',
    lastActiveHomeTile: '',
    tileClicksCount: {},
    lastUploadAt: null,
    lastAdminTab: 'summary',
    dismissedNotices: {},
    sessionsCount: 0,
    firstSeenAt: new Date().toISOString(),
    hasSeenStudioTooltip: false
};

// Safe getter
export function getLocalState(): UserState {
    if (typeof window === 'undefined') return defaultState;

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return defaultState;

        const parsed = JSON.parse(stored);
        return { ...defaultState, ...parsed }; // Merge to ensure new keys exist
    } catch (e) {
        console.warn('Failed to parse local state', e);
        return defaultState;
    }
}

// Safe setter (partial update)
export function updateLocalState(updates: Partial<UserState>) {
    if (typeof window === 'undefined') return;

    try {
        const current = getLocalState();
        const next = { ...current, ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
        console.warn('Failed to save local state', e);
    }
}

// Helpers for specific actions
export function incrementSession() {
    const s = getLocalState();
    // Only increment if last session was > 30 mins ago or new load? 
    // For simplicity, we just increment on call (usually app mount) if not done recently?
    // User requirement: just "sessionsCount". 
    // We'll increment only if not effectively done this session (sessionStorage?)
    // Or just let the caller handle logic. We'll simply provide the updater.
    updateLocalState({ sessionsCount: s.sessionsCount + 1 });
}

export function trackTileClick(tileId: string) {
    const s = getLocalState();
    const counts = { ...s.tileClicksCount };
    counts[tileId] = (counts[tileId] || 0) + 1;
    updateLocalState({
        tileClicksCount: counts,
        lastActiveHomeTile: tileId
    });
}

export function dismissNotice(noticeId: string) {
    const s = getLocalState();
    const notices = { ...s.dismissedNotices };
    notices[noticeId] = Date.now();
    updateLocalState({ dismissedNotices: notices });
}

export function isNoticeDismissed(noticeId: string, expiryMs = 24 * 60 * 60 * 1000): boolean {
    const s = getLocalState();
    const timestamp = s.dismissedNotices[noticeId];
    if (!timestamp) return false;

    return (Date.now() - timestamp) < expiryMs;
}
