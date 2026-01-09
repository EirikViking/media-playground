/**
 * Media Playground API - Cloudflare Worker with D1 + R2
 * 
 * Project Endpoints:
 * POST   /api/projects           - Create project
 * GET    /api/projects           - List projects
 * GET    /api/projects/:id       - Get project
 * PUT    /api/projects/:id       - Update project
 * DELETE /api/projects/:id       - Delete project (includes R2 cleanup)
 * 
 * Asset Endpoints (Phase 3A):
 * PUT    /api/upload/:projectId/:assetId/:kind - Upload original or thumb to R2
 * POST   /api/projects/:id/assets/commit       - Commit asset metadata to project
 * GET    /api/assets/:kind/:projectId/:assetId - Stream asset from R2
 * DELETE /api/projects/:id/assets/:assetId     - Delete asset from R2 and project
 */

export interface Env {
    DB: D1Database;
    BUCKET: R2Bucket;
    ADMIN_PASSWORD?: string;
}

// Constants
const MAX_FILE_SIZE = 120 * 1024 * 1024; // 120 MB
const MAX_ASSETS_PER_PROJECT = 50;
const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/wav'
];

interface ProjectData {
    title: string;
    data: string;
}

interface Project {
    id: string;
    title: string;
    data: string;
    created_at: string;
    updated_at: string;
}

interface AssetMetadata {
    assetId: string;
    originalKey: string;
    thumbKey: string;
    contentType: string;
    byteSize: number;
    width: number;
    height: number;
    fileName: string;
    createdAt: string;
}

interface ProjectJsonData {
    version: number;
    assets?: AssetMetadata[];
    mediaItems?: unknown[]; // Legacy field
    layout?: unknown;
}

// CORS headers - permissive for learning project
function corsHeaders(origin: string | null): HeadersInit {
    const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:4173',
        'http://127.0.0.1:5173',
    ];

    const allowOrigin = origin && (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.pages.dev') ||
        origin.endsWith('.workers.dev')
    ) ? origin : '*';

    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-admin-password',
        'Access-Control-Max-Age': '86400',
    };
}

function jsonResponse(data: unknown, status = 200, origin: string | null = null): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(origin),
        },
    });
}

function errorResponse(message: string, status = 400, origin: string | null = null): Response {
    return jsonResponse({ error: message }, status, origin);
}

// Helper to get project data JSON
async function getProjectData(env: Env, projectId: string): Promise<ProjectJsonData | null> {
    const project = await env.DB.prepare(
        'SELECT data FROM projects WHERE id = ?'
    ).bind(projectId).first<{ data: string }>();

    if (!project) return null;

    try {
        return JSON.parse(project.data) as ProjectJsonData;
    } catch {
        return { version: 1, assets: [] };
    }
}

// Helper to update project data JSON
async function updateProjectData(env: Env, projectId: string, data: ProjectJsonData): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await env.DB.prepare(
        'UPDATE projects SET data = ?, updated_at = ? WHERE id = ?'
    ).bind(JSON.stringify(data), now, projectId).run();

    return result.meta.changes > 0;
}

// Simple router
async function handleRequest(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const origin = request.headers.get('Origin');

    // Handle CORS preflight
    if (method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders(origin),
        });
    }

    // ==================== ASSET ENDPOINTS ====================

    // PUT /api/upload/:projectId/:assetId/:kind - Upload to R2
    const uploadMatch = path.match(/^\/api\/upload\/([^/]+)\/([^/]+)\/(original|thumb)$/);
    if (method === 'PUT' && uploadMatch) {
        try {
            const [, projectId, assetId, kind] = uploadMatch;
            const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
            const contentLength = parseInt(request.headers.get('Content-Length') || '0', 10);

            // Validate content type for originals
            if (kind === 'original' && !ALLOWED_TYPES.includes(contentType)) {
                return errorResponse(`Invalid content type. Allowed: ${ALLOWED_TYPES.join(', ')}`, 400, origin);
            }

            // Validate size
            if (contentLength > MAX_FILE_SIZE) {
                return errorResponse(`File too large. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB`, 400, origin);
            }

            // Check project exists
            const projectData = await getProjectData(env, projectId);
            if (!projectData) {
                return errorResponse('Project not found', 404, origin);
            }

            // Check asset limit for new assets
            const existingAsset = projectData.assets?.find(a => a.assetId === assetId);
            if (!existingAsset && kind === 'original') {
                const assetCount = projectData.assets?.length || 0;
                if (assetCount >= MAX_ASSETS_PER_PROJECT) {
                    return errorResponse(`Maximum ${MAX_ASSETS_PER_PROJECT} assets per project`, 400, origin);
                }
            }

            // Generate R2 key
            const key = `${projectId}/${assetId}/${kind}`;

            // Upload to R2
            const body = await request.arrayBuffer();
            await env.BUCKET.put(key, body, {
                httpMetadata: {
                    contentType: contentType,
                    cacheControl: 'public, max-age=31536000, immutable',
                },
            });

            return jsonResponse({
                ok: true,
                key,
                byteSize: body.byteLength,
            }, 200, origin);
        } catch (error) {
            console.error('Upload error:', error);
            return errorResponse('Failed to upload file', 500, origin);
        }
    }

    // POST /api/projects/:id/assets/commit - Commit asset metadata
    const commitMatch = path.match(/^\/api\/projects\/([^/]+)\/assets\/commit$/);
    if (method === 'POST' && commitMatch) {
        try {
            const projectId = commitMatch[1];
            const body = await request.json() as AssetMetadata;

            if (!body.assetId || !body.originalKey || !body.thumbKey) {
                return errorResponse('Missing required fields: assetId, originalKey, thumbKey', 400, origin);
            }

            const projectData = await getProjectData(env, projectId);
            if (!projectData) {
                return errorResponse('Project not found', 404, origin);
            }

            // Initialize assets array if needed
            if (!projectData.assets) {
                projectData.assets = [];
            }

            // Check if asset already exists (update) or new
            const existingIndex = projectData.assets.findIndex(a => a.assetId === body.assetId);

            const assetMeta: AssetMetadata = {
                assetId: body.assetId,
                originalKey: body.originalKey,
                thumbKey: body.thumbKey,
                contentType: body.contentType,
                byteSize: body.byteSize,
                width: body.width,
                height: body.height,
                fileName: body.fileName,
                createdAt: body.createdAt || new Date().toISOString(),
            };

            if (existingIndex >= 0) {
                projectData.assets[existingIndex] = assetMeta;
            } else {
                // Check limit
                if (projectData.assets.length >= MAX_ASSETS_PER_PROJECT) {
                    return errorResponse(`Maximum ${MAX_ASSETS_PER_PROJECT} assets per project`, 400, origin);
                }
                projectData.assets.push(assetMeta);
            }

            await updateProjectData(env, projectId, projectData);

            return jsonResponse({ ok: true, asset: assetMeta }, 200, origin);
        } catch (error) {
            console.error('Commit asset error:', error);
            return errorResponse('Failed to commit asset', 500, origin);
        }
    }

    // GET /api/assets/:kind/:projectId/:assetId - Stream from R2
    const assetMatch = path.match(/^\/api\/assets\/(original|thumb)\/([^/]+)\/([^/]+)$/);
    if (method === 'GET' && assetMatch) {
        try {
            const [, kind, projectId, assetId] = assetMatch;
            const key = `${projectId}/${assetId}/${kind}`;

            const object = await env.BUCKET.get(key);
            if (!object) {
                return errorResponse('Asset not found', 404, origin);
            }

            return new Response(object.body, {
                headers: {
                    'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'ETag': object.etag,
                    ...corsHeaders(origin),
                },
            });
        } catch (error) {
            console.error('Get asset error:', error);
            return errorResponse('Failed to get asset', 500, origin);
        }
    }

    // DELETE /api/projects/:id/assets/:assetId - Delete asset
    const deleteAssetMatch = path.match(/^\/api\/projects\/([^/]+)\/assets\/([^/]+)$/);
    if (method === 'DELETE' && deleteAssetMatch) {
        try {
            const [, projectId, assetId] = deleteAssetMatch;

            const projectData = await getProjectData(env, projectId);
            if (!projectData) {
                return errorResponse('Project not found', 404, origin);
            }

            const assetIndex = projectData.assets?.findIndex(a => a.assetId === assetId) ?? -1;
            if (assetIndex < 0) {
                return errorResponse('Asset not found', 404, origin);
            }

            const asset = projectData.assets![assetIndex];

            // Delete from R2
            await Promise.all([
                env.BUCKET.delete(asset.originalKey),
                env.BUCKET.delete(asset.thumbKey),
            ]);

            // Remove from project data
            projectData.assets!.splice(assetIndex, 1);
            await updateProjectData(env, projectId, projectData);

            return jsonResponse({ ok: true }, 200, origin);
        } catch (error) {
            console.error('Delete asset error:', error);
            return errorResponse('Failed to delete asset', 500, origin);
        }
    }

    // ==================== PROJECT ENDPOINTS ====================

    // POST /api/projects - Create project
    if (method === 'POST' && path === '/api/projects') {
        try {
            const body = await request.json() as ProjectData;

            if (!body.title || !body.data) {
                return errorResponse('Missing required fields: title, data', 400, origin);
            }

            const id = crypto.randomUUID();
            const now = new Date().toISOString();

            await env.DB.prepare(
                'INSERT INTO projects (id, title, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
            ).bind(id, body.title, body.data, now, now).run();

            return jsonResponse({ id }, 201, origin);
        } catch (error) {
            console.error('Create project error:', error);
            return errorResponse('Failed to create project', 500, origin);
        }
    }

    // GET /api/projects - List projects
    if (method === 'GET' && path === '/api/projects') {
        try {
            const result = await env.DB.prepare(
                'SELECT id, title, updated_at FROM projects ORDER BY updated_at DESC'
            ).all<Pick<Project, 'id' | 'title' | 'updated_at'>>();

            return jsonResponse(result.results, 200, origin);
        } catch (error) {
            console.error('List projects error:', error);
            return errorResponse('Failed to list projects', 500, origin);
        }
    }

    // GET /api/projects/:id - Get project
    const getMatch = path.match(/^\/api\/projects\/([^/]+)$/);
    if (method === 'GET' && getMatch) {
        try {
            const id = getMatch[1];
            const result = await env.DB.prepare(
                'SELECT id, title, data, updated_at FROM projects WHERE id = ?'
            ).bind(id).first<Project>();

            if (!result) {
                return errorResponse('Project not found', 404, origin);
            }

            return jsonResponse(result, 200, origin);
        } catch (error) {
            console.error('Get project error:', error);
            return errorResponse('Failed to get project', 500, origin);
        }
    }

    // PUT /api/projects/:id - Update project
    const putMatch = path.match(/^\/api\/projects\/([^/]+)$/);
    if (method === 'PUT' && putMatch) {
        try {
            const id = putMatch[1];
            const body = await request.json() as ProjectData;

            if (!body.title || !body.data) {
                return errorResponse('Missing required fields: title, data', 400, origin);
            }

            const now = new Date().toISOString();
            const result = await env.DB.prepare(
                'UPDATE projects SET title = ?, data = ?, updated_at = ? WHERE id = ?'
            ).bind(body.title, body.data, now, id).run();

            if (result.meta.changes === 0) {
                return errorResponse('Project not found', 404, origin);
            }

            return jsonResponse({ ok: true }, 200, origin);
        } catch (error) {
            console.error('Update project error:', error);
            return errorResponse('Failed to update project', 500, origin);
        }
    }

    // DELETE /api/projects/:id - Delete project (with R2 cleanup)
    const deleteMatch = path.match(/^\/api\/projects\/([^/]+)$/);
    if (method === 'DELETE' && deleteMatch) {
        try {
            const id = deleteMatch[1];

            // Get project data to find assets
            const projectData = await getProjectData(env, id);
            if (projectData?.assets?.length) {
                // Delete all assets from R2
                const deletePromises = projectData.assets.flatMap(asset => [
                    env.BUCKET.delete(asset.originalKey),
                    env.BUCKET.delete(asset.thumbKey),
                ]);
                await Promise.all(deletePromises);
            }

            // Delete from D1
            const result = await env.DB.prepare(
                'DELETE FROM projects WHERE id = ?'
            ).bind(id).run();

            if (result.meta.changes === 0) {
                return errorResponse('Project not found', 404, origin);
            }

            return jsonResponse({ ok: true }, 200, origin);
        } catch (error) {
            console.error('Delete project error:', error);
            return errorResponse('Failed to delete project', 500, origin);
        }
    }

    // ==================== ADMIN ENDPOINTS ====================

    // Helper for admin auth
    const isAdmin = request.headers.get('x-admin-password') === (env.ADMIN_PASSWORD || 'eirik123');

    // GET /api/admin/db/summary
    if (method === 'GET' && path === '/api/admin/db/summary') {
        if (!isAdmin) return errorResponse('Unauthorized', 401, origin);

        try {
            const projectsCount = await env.DB.prepare('SELECT COUNT(*) as count FROM projects').first<{ count: number }>();

            // Scan R2 for real storage stats
            let totalSize = 0;
            let totalObjects = 0;
            let truncated = true;
            let cursor;

            while (truncated) {
                const list = await env.BUCKET.list({ cursor });
                truncated = list.truncated;
                cursor = (list as any).cursor;

                totalSize += list.objects.reduce((sum, o) => sum + o.size, 0);
                totalObjects += list.objects.length;
            }

            const estimatedAssets = Math.floor(totalObjects / 2);

            return jsonResponse({
                projects: projectsCount?.count || 0,
                assets: estimatedAssets,
                totalSize,
                totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100
            }, 200, origin);
        } catch (error) {
            return errorResponse('Failed to get summary', 500, origin);
        }
    }

    // GET /api/admin/db/projects
    if (method === 'GET' && path === '/api/admin/db/projects') {
        if (!isAdmin) return errorResponse('Unauthorized', 401, origin);

        try {
            const result = await env.DB.prepare(
                'SELECT id, title, updated_at, LENGTH(data) as dataSize FROM projects ORDER BY updated_at DESC'
            ).all();
            return jsonResponse(result.results, 200, origin);
        } catch (error) {
            return errorResponse('Failed to list projects', 500, origin);
        }
    }

    // GET /api/admin/db/media (List all assets from R2)
    if (method === 'GET' && path === '/api/admin/db/media') {
        if (!isAdmin) return errorResponse('Unauthorized', 401, origin);

        try {
            // 1. Get D1 projects for metadata lookup
            const projects = await env.DB.prepare('SELECT id, title, data FROM projects').all<{ id: string, title: string, data: string }>();
            const projectMap = new Map<string, string>();
            const assetNameMap = new Map<string, string>();

            for (const p of projects.results) {
                projectMap.set(p.id, p.title);
                try {
                    const data = JSON.parse(p.data) as ProjectJsonData;
                    if (data.assets) {
                        for (const a of data.assets) assetNameMap.set(a.assetId, a.fileName);
                    }
                } catch { }
            }

            // 2. List R2
            const list = await env.BUCKET.list({ limit: 900 });
            const assets: any[] = [];

            list.objects.forEach(o => {
                if (o.key.endsWith('/original')) {
                    const parts = o.key.split('/');
                    if (parts.length === 3) {
                        const projectId = parts[0];
                        const assetId = parts[1];

                        assets.push({
                            assetId,
                            projectId,
                            fileName: assetNameMap.get(assetId) || 'Orphaned File',
                            projectTitle: projectMap.get(projectId) || 'Unknown Project',
                            byteSize: o.size,
                        });
                    }
                }
            });

            return jsonResponse(assets, 200, origin);
        } catch (error) {
            return errorResponse('Failed to list media', 500, origin);
        }
    }

    // DELETE /api/admin/db/reset (Wipe Everything!)
    if (method === 'DELETE' && path === '/api/admin/db/reset') {
        if (!isAdmin) return errorResponse('Unauthorized', 401, origin);

        try {
            // 1. List all objects in bucket
            let truncated = true;
            let cursor;

            while (truncated) {
                const list = await env.BUCKET.list({ cursor });
                truncated = list.truncated;
                cursor = (list as any).cursor;

                if (list.objects.length > 0) {
                    await env.BUCKET.delete(list.objects.map(o => o.key));
                }
            }

            // 2. Truncate DB
            await env.DB.prepare('DELETE FROM projects').run();

            return jsonResponse({ ok: true, message: 'All data wiped' }, 200, origin);
        } catch (error) {
            return errorResponse('Failed to reset DB', 500, origin);
        }
    }

    // DELETE /api/admin/db/project/:id
    const adminDelProjMatch = path.match(/^\/api\/admin\/db\/project\/([^/]+)$/);
    if (method === 'DELETE' && adminDelProjMatch) {
        if (!isAdmin) return errorResponse('Unauthorized', 401, origin);
        const id = adminDelProjMatch[1];
        try {
            const projectData = await getProjectData(env, id);
            if (projectData?.assets?.length) {
                const deletePromises = projectData.assets.flatMap(asset => [
                    env.BUCKET.delete(asset.originalKey),
                    env.BUCKET.delete(asset.thumbKey),
                ]);
                await Promise.all(deletePromises);
            }
            await env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
            return jsonResponse({ ok: true }, 200, origin);
        } catch (error) {
            return errorResponse('Failed to delete project', 500, origin);
        }
    }

    // DELETE /api/admin/db/media/:projectId/:assetId (Delete specific asset globally)
    const adminDelAssetMatch = path.match(/^\/api\/admin\/db\/media\/([^/]+)\/([^/]+)$/);
    if (method === 'DELETE' && adminDelAssetMatch) {
        if (!isAdmin) return errorResponse('Unauthorized', 401, origin);
        const projectId = adminDelAssetMatch[1];
        const assetId = adminDelAssetMatch[2];

        try {
            // Delete from R2
            await Promise.all([
                env.BUCKET.delete(`${projectId}/${assetId}/original`),
                env.BUCKET.delete(`${projectId}/${assetId}/thumb`)
            ]);

            // Try to clean from D1 if exists
            const project = await env.DB.prepare('SELECT data FROM projects WHERE id = ?').bind(projectId).first<{ data: string }>();
            if (project) {
                try {
                    const data = JSON.parse(project.data) as ProjectJsonData;
                    if (data.assets) {
                        const idx = data.assets.findIndex(a => a.assetId === assetId);
                        if (idx !== -1) {
                            data.assets.splice(idx, 1);
                            await updateProjectData(env, projectId, data);
                        }
                    }
                } catch { }
            }

            return jsonResponse({ ok: true }, 200, origin);
        } catch (error) {
            return errorResponse('Failed to delete media', 500, origin);
        }
    }

    // Health check
    if (method === 'GET' && path === '/api/health') {
        return jsonResponse({
            status: 'ok',
            timestamp: new Date().toISOString(),
            features: {
                d1: true,
                r2: typeof env.BUCKET !== 'undefined',
                adminConfigured: true,
            }
        }, 200, origin);
    }

    return errorResponse('Not found', 404, origin);
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        return handleRequest(request, env);
    },
};
