const ID_PATTERN = /^[a-f0-9-]{36}$/i;

export function isValidId(value: string): boolean {
    return ID_PATTERN.test(value);
}

export function getInvalidIdError(value: string, label: string): string | null {
    if (!value || !isValidId(value)) {
        return `Invalid ${label}`;
    }
    return null;
}

export function buildAssetKeys(projectId: string, assetId: string) {
    return {
        originalKey: `${projectId}/${assetId}/original`,
        thumbKey: `${projectId}/${assetId}/thumb`,
    };
}

export function keysMatch(projectId: string, assetId: string, originalKey: string, thumbKey: string): boolean {
    const expected = buildAssetKeys(projectId, assetId);
    return originalKey === expected.originalKey && thumbKey === expected.thumbKey;
}

export function isLegacyKeySafe(projectId: string, assetId: string, key: string): boolean {
    if (!key) return false;
    return key.includes(projectId) && key.includes(assetId);
}
