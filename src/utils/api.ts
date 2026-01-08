/**
 * API Client for Media Playground Backend
 * Falls back gracefully if backend is unavailable
 */

// API base URL configuration
// In dev: localhost worker
// In production: deployed Cloudflare Worker
const API_BASE = import.meta.env.DEV
    ? 'http://localhost:8787'
    : 'https://media-playground-api.eirikviking.workers.dev';

console.log('[API] Mode:', import.meta.env.DEV ? 'development' : 'production');
console.log('[API] Base URL:', API_BASE);

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
}

export const api = new ApiClient(API_BASE);
