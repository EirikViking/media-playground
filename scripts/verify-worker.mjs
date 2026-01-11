#!/usr/bin/env node
/**
 * Worker API Verification Script
 * Tests the R2 upload/download pipeline end-to-end
 * 
 * Usage:
 *   VERIFY_API_BASE=http://127.0.0.1:8787 node scripts/verify-worker.mjs
 *   VERIFY_API_BASE=https://media-playground-api.cromkake.workers.dev node scripts/verify-worker.mjs
 */

const API_BASE = process.env.VERIFY_API_BASE || 'http://127.0.0.1:8787';
const EXPECT_ADMIN_DISABLED = process.env.VERIFY_EXPECT_ADMIN_DISABLED === '1';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║       Media Playground Worker Verification Suite             ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log(`\n🔗 API Base: ${API_BASE}\n`);

let projectId = null;
let assetId = null;
let passed = 0;
let failed = 0;

async function test(name, fn) {
    process.stdout.write(`  ⏳ ${name}... `);
    try {
        await fn();
        console.log('✅ PASS');
        passed++;
        return true;
    } catch (error) {
        console.log('❌ FAIL');
        console.log(`     Error: ${error.message}`);
        failed++;
        return false;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

// Generate a tiny valid PNG (1x1 red pixel)
function createTestPng() {
    // Minimal valid PNG: 1x1 red pixel
    const pngBytes = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
        0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
        0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x18, 0xDD,
        0x8D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, // IEND chunk
        0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    return pngBytes;
}

async function main() {
    console.log('📋 Phase 1: Health Check\n');

    // Try /api/health first, fall back to /health
    let healthEndpoint = '/api/health';
    await test('Health check endpoint discovery', async () => {
        let response = await fetch(`${API_BASE}/api/health`);
        if (!response.ok) {
            response = await fetch(`${API_BASE}/health`);
            if (response.ok) {
                healthEndpoint = '/health';
                console.log(`\n     (Using ${healthEndpoint})`);
            }
        }
        assert(response.ok, `Health endpoint returned ${response.status}`);
    });

    await test('Health response has correct structure', async () => {
        const response = await fetch(`${API_BASE}${healthEndpoint}`);
        const data = await response.json();
        assert(data.status === 'ok', `Expected status 'ok', got '${data.status}'`);
        assert(data.features?.d1 === true, 'D1 feature not available');
        assert(data.features?.r2 === true, 'R2 feature not available');
    });

    if (EXPECT_ADMIN_DISABLED) {
        await test('Admin endpoints disabled when ADMIN_PASSWORD missing', async () => {
            const response = await fetch(`${API_BASE}/api/admin/quota`);
            assert(response.status === 503, `Expected 503, got ${response.status}`);
        });
    }

    console.log('\n📋 Phase 2: Project Creation\n');

    await test('Create test project', async () => {
        const response = await fetch(`${API_BASE}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Verification Test Project',
                data: JSON.stringify({ version: 2, assets: [] })
            })
        });
        assert(response.ok, `Create project returned ${response.status}`);
        const data = await response.json();
        assert(data.id, 'No project ID returned');
        projectId = data.id;
        console.log(`\n     (Project ID: ${projectId})`);
    });

    console.log('\n📋 Phase 3: Asset Upload (R2)\n');

    assetId = crypto.randomUUID();
    const originalKey = `${projectId}/${assetId}/original`;
    const thumbKey = `${projectId}/${assetId}/thumb`;

    await test('Upload original image to R2', async () => {
        const pngData = createTestPng();
        const response = await fetch(`${API_BASE}/api/upload/${projectId}/${assetId}/original`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'image/png',
                'Content-Length': pngData.length.toString()
            },
            body: pngData
        });

        if (!response.ok) {
            throw new Error(`Upload original returned ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        assert(data.ok === true, 'Upload did not return ok: true');
        assert(data.key === originalKey, `Wrong key returned: ${data.key}`);
    });

    await test('Upload thumbnail to R2', async () => {
        const pngData = createTestPng();
        const response = await fetch(`${API_BASE}/api/upload/${projectId}/${assetId}/thumb`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'image/webp',
                'Content-Length': pngData.length.toString()
            },
            body: pngData
        });

        if (!response.ok) {
            throw new Error(`Upload thumb returned ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        assert(data.ok === true, 'Upload did not return ok: true');
    });

    await test('Commit asset metadata', async () => {
        const response = await fetch(`${API_BASE}/api/projects/${projectId}/assets/commit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                assetId,
                contentType: 'image/png',
                byteSize: 67,
                width: 1,
                height: 1,
                fileName: 'test.png',
                createdAt: new Date().toISOString()
            })
        });
        assert(response.ok, `Commit returned ${response.status}`);
        const data = await response.json();
        assert(data.ok === true, 'Commit did not return ok: true');
        assert(data.asset?.originalKey === originalKey, `Expected originalKey ${originalKey}, got ${data.asset?.originalKey}`);
        assert(data.asset?.thumbKey === thumbKey, `Expected thumbKey ${thumbKey}, got ${data.asset?.thumbKey}`);
    });

    console.log('\n📋 Phase 4: Asset Retrieval (R2 Streaming)\n');

    await test('Fetch original from R2', async () => {
        const response = await fetch(`${API_BASE}/api/assets/original/${projectId}/${assetId}`);
        assert(response.ok, `Fetch original returned ${response.status}`);

        const contentType = response.headers.get('Content-Type');
        assert(contentType?.includes('image'), `Expected image content-type, got: ${contentType}`);

        const cacheControl = response.headers.get('Cache-Control');
        assert(cacheControl, 'No Cache-Control header');
        assert(cacheControl.includes('max-age'), 'Cache-Control missing max-age');

        const body = await response.arrayBuffer();
        assert(body.byteLength > 0, 'Empty response body');
    });

    await test('Fetch thumbnail from R2', async () => {
        const response = await fetch(`${API_BASE}/api/assets/thumb/${projectId}/${assetId}`);
        assert(response.ok, `Fetch thumb returned ${response.status}`);

        const contentType = response.headers.get('Content-Type');
        assert(contentType?.includes('image'), `Expected image content-type, got: ${contentType}`);
    });

    await test('Project data includes asset', async () => {
        const response = await fetch(`${API_BASE}/api/projects/${projectId}`);
        assert(response.ok, `Fetch project returned ${response.status}`);
        const data = await response.json();
        const parsed = JSON.parse(data.data);
        assert(parsed.assets?.length === 1, `Expected 1 asset, got ${parsed.assets?.length}`);
        assert(parsed.assets[0].assetId === assetId, 'Asset ID mismatch');
    });

    console.log('\n📋 Phase 5: Cleanup\n');

    await test('Delete asset', async () => {
        const response = await fetch(`${API_BASE}/api/projects/${projectId}/assets/${assetId}`, {
            method: 'DELETE'
        });
        assert(response.ok, `Delete asset returned ${response.status}`);
        const data = await response.json();
        assert(data.ok === true, 'Delete did not return ok: true');
    });

    await test('Verify asset deleted from R2', async () => {
        const response = await fetch(`${API_BASE}/api/assets/original/${projectId}/${assetId}`);
        // 404 is the expected correct behavior for a deleted asset
        assert(response.status === 404, `Expected 404 (Not Found) for deleted asset, got ${response.status}`);
    });

    await test('Delete test project', async () => {
        const response = await fetch(`${API_BASE}/api/projects/${projectId}`, {
            method: 'DELETE'
        });
        assert(response.ok, `Delete project returned ${response.status}`);
    });

    // Summary
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log(`║  Results: ${passed} passed, ${failed} failed                              ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    if (failed > 0) {
        console.log('❌ Verification FAILED\n');
        process.exit(1);
    } else {
        console.log('✅ All verifications PASSED\n');
        process.exit(0);
    }
}

main().catch(error => {
    console.error('\n💥 Unexpected error:', error);

    // Cleanup on error
    if (projectId) {
        console.log('🧹 Attempting cleanup...');
        fetch(`${API_BASE}/api/projects/${projectId}`, { method: 'DELETE' })
            .catch(() => { });
    }

    process.exit(1);
});
