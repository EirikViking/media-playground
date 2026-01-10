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

    // ... (interfaces)

    interface ChaosItem {
        id: string;
        project_id: string;
        title: string;
        created_at: string;
        output_key: string;
        output_type: string;
        output_size: number;
    }

    // ... (existing helper functions)

    // ==================== CHAOS ENDPOINTS ====================

    // POST /api/chaos/publish
    if (method === 'POST' && path === '/api/chaos/publish') {
        try {
            const contentType = request.headers.get('Content-Type') || '';
            if (!contentType.includes('multipart/form-data')) {
                return errorResponse('Content-Type must be multipart/form-data', 400, origin);
            }

            const formData = await request.formData();
            const file = formData.get('file') as File;
            const projectId = formData.get('projectId') as string;
            const title = formData.get('title') as string || 'Untitled Chaos';

            if (!file || !projectId) {
                return errorResponse('Missing file or projectId', 400, origin);
            }

            const chaosId = crypto.randomUUID();
            const key = `chaos/${projectId}/${chaosId}`;

            // Upload to R2
            await env.BUCKET.put(key, await file.arrayBuffer(), {
                httpMetadata: {
                    contentType: file.type,
                    cacheControl: 'public, max-age=31536000, immutable',
                },
            });

            // Save to D1
            const now = new Date().toISOString();
            await env.DB.prepare(
                'INSERT INTO chaos_items (id, project_id, title, created_at, output_key, output_type, output_size) VALUES (?, ?, ?, ?, ?, ?, ?)'
            ).bind(chaosId, projectId, title, now, key, file.type, file.size).run();

            // Return success with public URL (constructed client side or returned here)
            // We'll return the ID and let client construct URL via /api/chaos/:id/content or similar if needed, 
            // but for R2 we might want a direct proxy endpoint.
            return jsonResponse({
                id: chaosId,
                url: `/api/chaos/${chaosId}/content`,
                createdAt: now
            }, 201, origin);

        } catch (error) {
            console.error('Chaos publish error:', error);
            return errorResponse('Failed to publish chaos', 500, origin);
        }
    }

    // GET /api/chaos - List chaos items
    if (method === 'GET' && path === '/api/chaos') {
        try {
            const url = new URL(request.url);
            const limit = parseInt(url.searchParams.get('limit') || '20', 10);

            // Allow basic pagination if needed later, for now just limit
            const result = await env.DB.prepare(
                'SELECT * FROM chaos_items ORDER BY created_at DESC LIMIT ?'
            ).bind(limit).all<ChaosItem>();

            return jsonResponse(result.results, 200, origin);
        } catch (error) {
            console.error('List chaos error:', error);
            return errorResponse('Failed to list chaos', 500, origin);
        }
    }

    // GET /api/chaos/:id - Get chaos item details
    const chaosMatch = path.match(/^\/api\/chaos\/([^/]+)$/);
    if (method === 'GET' && chaosMatch) {
        const id = chaosMatch[1];
        try {
            const result = await env.DB.prepare('SELECT * FROM chaos_items WHERE id = ?').bind(id).first<ChaosItem>();
            if (!result) return errorResponse('Chaos item not found', 404, origin);
            return jsonResponse(result, 200, origin);
        } catch (error) {
            return errorResponse('Failed to get chaos item', 500, origin);
        }
    }

    // GET /api/chaos/:id/content - content proxy
    const chaosContentMatch = path.match(/^\/api\/chaos\/([^/]+)\/content$/);
    if (method === 'GET' && chaosContentMatch) {
        const id = chaosContentMatch[1];
        try {
            const item = await env.DB.prepare('SELECT output_key FROM chaos_items WHERE id = ?').bind(id).first<{ output_key: string }>();
            if (!item) return errorResponse('Chaos item not found', 404, origin);

            const object = await env.BUCKET.get(item.output_key);
            if (!object) return errorResponse('File not found', 404, origin);

            return new Response(object.body, {
                headers: {
                    'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'ETag': object.etag,
                    ...corsHeaders(origin),
                }
            });
        } catch (e) {
            return errorResponse('Failed to get content', 500, origin);
        }
    }

    // ==================== PROJECT ENDPOINTS ====================

    // POST /api/projects - Create project
    // Updated to support { name: string } input
    if (method === 'POST' && path === '/api/projects') {
        try {
            const body = await request.json() as any;

            // Support both old { title, data } and new { name }
            const title = body.title || body.name;
            const data = body.data || JSON.stringify({ version: 1, assets: [], mediaItems: [] });

            if (!title) {
                return errorResponse('Missing required field: name (or title)', 400, origin);
            }

            const id = crypto.randomUUID();
            const now = new Date().toISOString();

            await env.DB.prepare(
                'INSERT INTO projects (id, title, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
            ).bind(id, title, data, now, now).run();

            return jsonResponse({ id, projectId: id }, 201, origin);
        } catch (error) {
            console.error('Create project error:', error);
            return errorResponse('Failed to create project', 500, origin);
        }
    }

    // GET /api/projects - List projects (Public Gallery)
    if (method === 'GET' && path === '/api/projects') {
        try {
            const url = new URL(request.url);
            const limit = parseInt(url.searchParams.get('limit') || '50', 10);

            const result = await env.DB.prepare(
                'SELECT id, title, updated_at, created_at FROM projects ORDER BY updated_at DESC LIMIT ?'
            ).bind(limit).all<Pick<Project, 'id' | 'title' | 'updated_at' | 'created_at'>>();

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

    // ==================== ADMIN AUTH & HELPERS ====================

    async function signToken(data: string, secret: string): Promise<string> {
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw", enc.encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false, ["sign"]
        );
        const signature = await crypto.subtle.sign(
            "HMAC", key, enc.encode(data)
        );
        return btoa(String.fromCharCode(...new Uint8Array(signature)));
    }

    async function verifyToken(token: string, secret: string): Promise<boolean> {
        try {
            const decoded = atob(token);
            const [data, signatureB64] = decoded.split('.');
            if (!data || !signatureB64) return false;

            const exp = parseInt(data, 10);
            if (Date.now() > exp) return false;

            const expectedSig = await signToken(data, secret);
            // Simple string compare is fine for this scope, technically timing attack possible but low risk here
            return signatureB64 === expectedSig.split('.')[0]; // signToken returns base64 of raw signature? No, my wrappers need alignment.
            // Let's ensure signToken returns just the signature b64.
        } catch {
            return false;
        }
    }

    // NOTE: reimplementing signToken to be cleaner for matching
    async function createAdminToken(secret: string): Promise<string> {
        const exp = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        const data = exp.toString();

        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw", enc.encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false, ["sign"]
        );
        const signature = await crypto.subtle.sign(
            "HMAC", key, enc.encode(data)
        );
        const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
        return btoa(`${data}.${sigB64}`);
    }

    // Helper for admin auth
    const adminPassword = env.ADMIN_PASSWORD || 'eirik123';
    let isAdmin = request.headers.get('x-admin-password') === adminPassword;

    // Check token if not already auth via password
    if (!isAdmin) {
        const token = request.headers.get('x-admin-token');
        if (token) {
            try {
                const decodedBlob = atob(token);
                const [expStr, sig] = decodedBlob.split('.');
                if (expStr && sig) {
                    const exp = parseInt(expStr, 10);
                    if (Date.now() < exp) {
                        // Re-sign to verify
                        const enc = new TextEncoder();
                        const key = await crypto.subtle.importKey(
                            "raw", enc.encode(adminPassword),
                            { name: "HMAC", hash: "SHA-256" },
                            false, ["sign"]
                        );
                        const signature = await crypto.subtle.sign(
                            "HMAC", key, enc.encode(expStr)
                        );
                        const expectedSig = btoa(String.fromCharCode(...new Uint8Array(signature)));
                        if (sig === expectedSig) {
                            isAdmin = true;
                        }
                    }
                }
            } catch (e) {
                // Invalid token
            }
        }
    }

    // POST /api/admin/login
    if (method === 'POST' && path === '/api/admin/login') {
        try {
            const body = await request.json() as { password?: string };
            if (body.password === adminPassword) {
                const token = await createAdminToken(adminPassword);
                return jsonResponse({ ok: true, token }, 200, origin);
            } else {
                return errorResponse('Invalid password', 401, origin);
            }
        } catch (e) {
            return errorResponse('Login failed', 400, origin);
        }
    }

    // PUT /api/admin/db/project/:id/rename
    const adminRenameProjMatch = path.match(/^\/api\/admin\/db\/project\/([^/]+)\/rename$/);
    if (method === 'PUT' && adminRenameProjMatch) {
        if (!isAdmin) return errorResponse('Unauthorized', 401, origin);
        const id = adminRenameProjMatch[1];
        try {
            const body = await request.json() as { title: string };
            if (!body.title) return errorResponse('Missing title', 400, origin);

            // Update DB column
            await env.DB.prepare('UPDATE projects SET title = ?, updated_at = ? WHERE id = ?')
                .bind(body.title, new Date().toISOString(), id).run();

            // Try to update interior JSON data if possible, but not strictly required for listing.
            // Best effort update of internal JSON
            const project = await env.DB.prepare('SELECT data FROM projects WHERE id = ?').bind(id).first<{ data: string }>();
            if (project && project.data) {
                try {
                    const dataObj = JSON.parse(project.data);
                    // Usually we don't store title in data, but if we did/should:
                    // dataObj.title = body.title; 
                    // Let's just leave data alone as title is column-based for the gallery.
                } catch { }
            }

            return jsonResponse({ ok: true }, 200, origin);
        } catch (e) {
            return errorResponse('Rename failed', 500, origin);
        }
    }

    // PUT /api/admin/db/chaos/:id/rename
    const adminRenameChaosMatch = path.match(/^\/api\/admin\/db\/chaos\/([^/]+)\/rename$/);
    if (method === 'PUT' && adminRenameChaosMatch) {
        if (!isAdmin) return errorResponse('Unauthorized', 401, origin);
        const id = adminRenameChaosMatch[1];
        try {
            const body = await request.json() as { title: string };
            if (!body.title) return errorResponse('Missing title', 400, origin);

            await env.DB.prepare('UPDATE chaos_items SET title = ? WHERE id = ?')
                .bind(body.title, id).run();

            return jsonResponse({ ok: true }, 200, origin);
        } catch (e) {
            return errorResponse('Rename failed', 500, origin);
        }
    }

    // ==================== ADMIN ENDPOINTS (Rest) ====================

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

    // DELETE /api/admin/db/chaos/:id
    const adminDelChaosMatch = path.match(/^\/api\/admin\/db\/chaos\/([^/]+)$/);
    if (method === 'DELETE' && adminDelChaosMatch) {
        if (!isAdmin) return errorResponse('Unauthorized', 401, origin);
        const id = adminDelChaosMatch[1];
        try {
            // Get chaos item to find R2 key
            const item = await env.DB.prepare('SELECT output_key FROM chaos_items WHERE id = ?').bind(id).first<{ output_key: string }>();
            if (item) {
                await env.BUCKET.delete(item.output_key);
                await env.DB.prepare('DELETE FROM chaos_items WHERE id = ?').bind(id).run();
                return jsonResponse({ ok: true }, 200, origin);
            } else {
                return errorResponse('Chaos item not found', 404, origin);
            }
        } catch (error) {
            return errorResponse('Failed to delete chaos item', 500, origin);
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
                adminConfigured: !!(env.ADMIN_PASSWORD && env.ADMIN_PASSWORD !== 'eirik123'),
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
