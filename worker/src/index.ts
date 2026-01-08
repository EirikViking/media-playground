/**
 * Media Playground API - Cloudflare Worker with D1
 * 
 * Endpoints:
 * POST   /api/projects      - Create project
 * GET    /api/projects      - List projects
 * GET    /api/projects/:id  - Get project
 * PUT    /api/projects/:id  - Update project
 * DELETE /api/projects/:id  - Delete project
 */

export interface Env {
    DB: D1Database;
}

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

// CORS headers - permissive for learning project
function corsHeaders(origin: string | null): HeadersInit {
    const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:4173',
        'http://127.0.0.1:5173',
    ];

    // Allow same-origin or listed dev origins
    const allowOrigin = origin && (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.pages.dev') ||
        origin.endsWith('.workers.dev')
    ) ? origin : '*';

    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
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

    // Route: POST /api/projects - Create project
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

    // Route: GET /api/projects - List projects
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

    // Route: GET /api/projects/:id - Get project
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

    // Route: PUT /api/projects/:id - Update project
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

    // Route: DELETE /api/projects/:id - Delete project
    const deleteMatch = path.match(/^\/api\/projects\/([^/]+)$/);
    if (method === 'DELETE' && deleteMatch) {
        try {
            const id = deleteMatch[1];
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

    // Health check
    if (method === 'GET' && path === '/api/health') {
        return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() }, 200, origin);
    }

    return errorResponse('Not found', 404, origin);
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        return handleRequest(request, env);
    },
};
