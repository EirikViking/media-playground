/**
 * API Client for Media Playground Backend
 * Falls back gracefully if backend is unavailable
 */

import { CloudAsset } from '../types';

// API base URL configuration
// In dev: localhost worker
// In production: deployed Cloudflare Worker
const VITE_API_BASE = import.meta.env.VITE_API_BASE;
const API_BASE = VITE_API_BASE || (import.meta.env.DEV
    ? 'http://localhost:8787'
    : 'https://media-playground-api.cromkake.workers.dev');

console.log('[API] Environment:', import.meta.env.DEV ? 'development' : 'production');
console.log('[API] VITE_API_BASE:', VITE_API_BASE);
console.log('[API] Final Base URL:', API_BASE);

export { API_BASE };

export interface ProjectSummary {
    id: string;
    title: string;
    updated_at: string;
}

export interface ProjectData {
    id: string;
    title: string;
    data: string;
    updated_at: string;
}

export interface ApiError {
    error: string;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(
        path: string,
        options: RequestInit = {}
    ): Promise<{ data?: T; error?: string }> {
        const url = `${this.baseUrl}${path}`;
        const method = options.method || 'GET';

        try {
            console.log(`[API] ${method} ${path}`);
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            // Try to parse JSON, but handle non-JSON responses (like 404 pages)
            let data: any;
            let textBody: string | undefined;

            try {
                // Clone response to read text if JSON fails
                const clone = response.clone();
                textBody = await clone.text();
                data = JSON.parse(textBody);
            } catch (e) {
                // Not JSON
                data = null;
            }

            if (!response.ok) {
                const errorMessage = (data as ApiError)?.error || textBody?.substring(0, 100) || response.statusText;
                console.error(`[API Error] ${method} ${path} -> ${response.status}`, errorMessage);

                // Return descriptive error with endpoint
                return {
                    error: `${response.status} ${response.statusText}: ${errorMessage} (${path})`
                };
            }

            return { data: data as T };
        } catch (error) {
            console.error(`[API Network Error] ${method} ${path}:`, error);
            return { error: `Network error accessing ${path}: ${error instanceof Error ? error.message : String(error)}` };
        }
    }

    // ==================== PROJECT METHODS ====================

    // Updated to allow creating with just a name (returns default data from server)
    async createProject(title: string, data?: string): Promise<{ data?: { id: string; projectId?: string }; error?: string }> {
        return this.request<{ id: string; projectId?: string }>('/api/projects', {
            method: 'POST',
            body: JSON.stringify({ name: title, data }),
        });
    }

    async listProjects(limit = 50): Promise<{ data?: ProjectSummary[]; error?: string }> {
        return this.request<ProjectSummary[]>(`/api/projects?limit=${limit}`);
    }

    async getProject(id: string): Promise<{ data?: ProjectData; error?: string }> {
        return this.request<ProjectData>(`/api/projects/${id}`);
    }

    async updateProject(id: string, title: string, data: string): Promise<{ data?: { ok: boolean }; error?: string }> {
        return this.request<{ ok: boolean }>(`/api/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ title, data }),
        });
    }

    async deleteProject(id: string): Promise<{ data?: { ok: boolean }; error?: string }> {
        return this.request<{ ok: boolean }>(`/api/projects/${id}`, {
            method: 'DELETE',
        });
    }

    async healthCheck(): Promise<boolean> {
        const result = await this.request<{ status: string }>('/api/health');
        return result.data?.status === 'ok';
    }

    // ==================== CHAOS METHODS ====================

    async publishChaos(projectId: string, title: string, file: Blob): Promise<{ data?: { id: string; url: string }; error?: string }> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('title', title);

        // Fetch wrapper doesn't auto-set Content-Type for FormData if we manually set it, 
        // passing FormData body to fetch usually handles it. 
        // However, our request wrapper sets Content-Type: application/json by default.
        // We need to bypass that.
        const url = `${this.baseUrl}/api/chaos/publish`;

        try {
            console.log(`[API] POST ${url} (Chaos Upload)`);
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const text = await response.text();
                return { error: `Chaos publish failed: ${text}` };
            }

            const data = await response.json();
            return { data: data as { id: string; url: string } };
        } catch (error) {
            return { error: `Network error publishing chaos: ${error}` };
        }
    }

    async listChaos(limit = 20): Promise<{ data?: any[]; error?: string }> {
        return this.request<any[]>(`/api/chaos?limit=${limit}`);
    }

    async getChaosContentUrl(id: string): Promise<string> {
        return `${this.baseUrl}/api/chaos/${id}/content`;
    }

    // ==================== ASSET METHODS ====================
    // ... existing asset methods ...

    // ==================== ASSET METHODS ====================

    /**
     * Upload a file to R2 via Worker
     */
    async uploadFile(
        projectId: string,
        assetId: string,
        kind: 'original' | 'thumb',
        file: File
    ): Promise<{ data?: { ok: boolean; key: string; byteSize: number }; error?: string }> {
        const path = `/api/upload/${projectId}/${assetId}/${kind}`;
        const url = `${this.baseUrl}${path}`;

        console.log(`[API] Uploading ${kind} to ${path} (Size: ${file.size})`);

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': file.type,
                    'Content-Length': file.size.toString(),
                },
                body: file,
            });

            // Handle response parsing carefully
            let data: any;
            let textBody: string | undefined;

            try {
                const clone = response.clone();
                textBody = await clone.text();
                data = JSON.parse(textBody);
            } catch (e) {
                data = null;
            }

            if (!response.ok) {
                const errorMessage = (data as ApiError)?.error || textBody?.substring(0, 100) || response.statusText;
                console.error(`[API Error] PUT ${path} -> ${response.status}`, errorMessage);
                return {
                    error: `Upload failed ${response.status}: ${errorMessage} (${path})`
                };
            }

            return { data: data as { ok: boolean; key: string; byteSize: number } };
        } catch (error) {
            console.error(`[API Network Error] PUT ${path}:`, error);
            return {
                error: `Network error uploading to ${path}`
            };
        }
    }

    /**
     * Commit asset metadata after upload
     */
    async commitAsset(
        projectId: string,
        asset: CloudAsset
    ): Promise<{ data?: { ok: boolean; asset: CloudAsset }; error?: string }> {
        return this.request<{ ok: boolean; asset: CloudAsset }>(
            `/api/projects/${projectId}/assets/commit`,
            {
                method: 'POST',
                body: JSON.stringify(asset),
            }
        );
    }

    /**
     * Delete an asset from project and R2
     */
    async deleteAsset(
        projectId: string,
        assetId: string
    ): Promise<{ data?: { ok: boolean }; error?: string }> {
        return this.request<{ ok: boolean }>(
            `/api/projects/${projectId}/assets/${assetId}`,
            { method: 'DELETE' }
        );
    }

    /**
     * Get URL for asset (thumb or original)
     */
    getAssetUrl(projectId: string, assetId: string, kind: 'original' | 'thumb'): string {
        return `${this.baseUrl}/api/assets/${kind}/${projectId}/${assetId}`;
    }
}

export const api = new ApiClient(API_BASE);
