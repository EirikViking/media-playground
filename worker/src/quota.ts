
import { Env } from './index';

export interface QuotaInfo {
    r2_used_bytes: number;
    r2_limit_bytes: number;
    r2_remaining_bytes: number;
    near_limit: boolean;
    updated_at: string;
}

export interface QuotaStatus {
    uploads_allowed: boolean;
    reason?: string;
    updated_at: string;
}

// Default limit: 10 GB
const DEFAULT_LIMIT = 10 * 1024 * 1024 * 1024;
const BUFFER_BYTES = 200 * 1024 * 1024;

let cachedUsage = {
    bytes: 0,
    timestamp: 0
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getStorageUsage(env: Env): Promise<number> {
    const now = Date.now();
    if (now - cachedUsage.timestamp < CACHE_TTL_MS && cachedUsage.bytes > 0) {
        return cachedUsage.bytes;
    }

    let totalSize = 0;
    let truncated = true;
    let cursor: string | undefined;

    while (truncated) {
        const list = await env.BUCKET.list({ cursor });
        truncated = list.truncated;
        cursor = (list as any).cursor;

        totalSize += list.objects.reduce((sum, o) => sum + o.size, 0);
    }

    cachedUsage = {
        bytes: totalSize,
        timestamp: now
    };

    return totalSize;
}

export function getLimit(env: Env): number {
    if (env.R2_FREE_LIMIT_BYTES) {
        return parseInt(env.R2_FREE_LIMIT_BYTES, 10) || DEFAULT_LIMIT;
    }
    return DEFAULT_LIMIT;
}

export async function getQuotaInfo(env: Env): Promise<QuotaInfo> {
    const used = await getStorageUsage(env);
    const limit = getLimit(env);
    const remaining = Math.max(0, limit - used);

    return {
        r2_used_bytes: used,
        r2_limit_bytes: limit,
        r2_remaining_bytes: remaining,
        near_limit: remaining < BUFFER_BYTES,
        updated_at: new Date(cachedUsage.timestamp).toISOString()
    };
}

export async function getQuotaStatus(env: Env): Promise<QuotaStatus> {
    const info = await getQuotaInfo(env);
    const allowed = info.r2_remaining_bytes > 0;

    return {
        uploads_allowed: allowed,
        reason: allowed ? undefined : 'Storage limit reached',
        updated_at: info.updated_at
    };
}
