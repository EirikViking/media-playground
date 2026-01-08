/**
 * API Client for Media Playground Backend
 * Falls back gracefully if backend is unavailable
 */

import { CloudAsset } from '../types';

// API base URL configuration
// In dev: localhost worker
// In production: deployed Cloudflare Worker
const API_BASE = import.meta.env.DEV
    ? 'http://localhost:8787'
    : 'https://media-playground-api.cromkake.workers.dev';

console.log('[API] Mode:', import.meta.env.DEV ? 'development' : 'production');
console.log('[API] Base URL:', API_BASE);

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
        try {
            const response = await fetch(`${this.baseUrl}${path}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                return { error: (data as ApiError).error || 'Request failed' };
            }

            return { data: data as T };
        } catch (error) {
            console.error('API request failed:', error);
            return { error: 'Network error - backend may be unavailable' };
        }
    }

    // ==================== PROJECT METHODS ====================

    async createProject(title: string, data: string): Promise<{ data?: { id: string }; error?: string }> {
        return this.request<{ id: string }>('/api/projects', {
            method: 'POST',
            body: JSON.stringify({ title, data }),
        });
    }

    async listProjects(): Promise<{ data?: ProjectSummary[]; error?: string }> {
        return this.request<ProjectSummary[]>('/api/projects');
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
        try {
            const response = await fetch(
                `${this.baseUrl}/api/upload/${projectId}/${assetId}/${kind}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': file.type,
                        'Content-Length': file.size.toString(),
                    },
                    body: file,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                return { error: (data as ApiError).error || 'Upload failed' };
            }

            return { data: data as { ok: boolean; key: string; byteSize: number } };
        } catch (error) {
            console.error('Upload failed:', error);
            return { error: 'Network error during upload' };
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
