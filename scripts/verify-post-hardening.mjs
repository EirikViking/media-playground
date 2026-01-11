#!/usr/bin/env node
/**
 * Post-hardening smoke checks (local worker or remote).
 *
 * Usage:
 *   VERIFY_API_BASE=http://127.0.0.1:8787 node scripts/verify-post-hardening.mjs
 *   VERIFY_EXPECT_ADMIN_DISABLED=1 node scripts/verify-post-hardening.mjs
 *   VERIFY_VIDEO_URL=https://... node scripts/verify-post-hardening.mjs
 */

const API_BASE = process.env.VERIFY_API_BASE || 'http://127.0.0.1:8787';
const EXPECT_ADMIN_DISABLED = process.env.VERIFY_EXPECT_ADMIN_DISABLED === '1';
const VIDEO_URL = process.env.VERIFY_VIDEO_URL || '';

let projectId = null;
let assetId = null;

async function test(name, fn) {
  process.stdout.write(`  - ${name}... `);
  try {
    await fn();
    console.log('OK');
  } catch (error) {
    console.log('FAIL');
    console.error(`    ${error.message}`);
    process.exitCode = 1;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createDummyBytes(size) {
  return new Uint8Array(size).fill(0);
}

async function main() {
  console.log(`API Base: ${API_BASE}`);

  await test('Health endpoint returns ok', async () => {
    const res = await fetch(`${API_BASE}/api/health`);
    assert(res.ok, `Health status ${res.status}`);
    const data = await res.json();
    assert(data.status === 'ok', 'Health payload missing status ok');
  });

  if (EXPECT_ADMIN_DISABLED) {
    await test('Admin endpoint returns 503 when ADMIN_PASSWORD missing', async () => {
      const res = await fetch(`${API_BASE}/api/admin/quota`);
      assert(res.status === 503, `Expected 503, got ${res.status}`);
    });
  }

  await test('Create project', async () => {
    const res = await fetch(`${API_BASE}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Post-hardening check', data: JSON.stringify({ version: 2, assets: [] }) })
    });
    assert(res.ok, `Create project status ${res.status}`);
    const data = await res.json();
    assert(data.id, 'Missing project id');
    projectId = data.id;
  });

  await test('List projects includes new project', async () => {
    const res = await fetch(`${API_BASE}/api/projects?limit=5`);
    assert(res.ok, `List projects status ${res.status}`);
    const data = await res.json();
    const found = Array.isArray(data) && data.some((p) => p.id === projectId);
    assert(found, 'New project not found in list');
  });

  await test('Upload audio asset (original)', async () => {
    assetId = crypto.randomUUID();
    const payload = createDummyBytes(256);
    const res = await fetch(`${API_BASE}/api/upload/${projectId}/${assetId}/original`, {
      method: 'PUT',
      headers: { 'Content-Type': 'audio/wav' },
      body: payload
    });
    assert(res.ok, `Upload status ${res.status}`);
  });

  await test('Commit asset metadata', async () => {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/assets/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetId,
        contentType: 'audio/wav',
        byteSize: 256,
        width: 0,
        height: 0,
        fileName: 'tone.wav',
        createdAt: new Date().toISOString()
      })
    });
    assert(res.ok, `Commit status ${res.status}`);
  });

  await test('Range request returns 206 and Accept-Ranges', async () => {
    const res = await fetch(`${API_BASE}/api/assets/original/${projectId}/${assetId}`, {
      headers: { Range: 'bytes=0-15' }
    });
    assert(res.status === 206, `Expected 206, got ${res.status}`);
    const acceptRanges = res.headers.get('Accept-Ranges');
    assert(acceptRanges === 'bytes', `Accept-Ranges missing: ${acceptRanges}`);
    const contentRange = res.headers.get('Content-Range');
    assert(contentRange && contentRange.startsWith('bytes 0-'), `Content-Range missing: ${contentRange}`);
  });

  if (VIDEO_URL) {
    await test('Video URL responds with 200/206 and video content-type', async () => {
      const res = await fetch(VIDEO_URL, { headers: { Range: 'bytes=0-1023' } });
      assert(res.status === 206 || res.status === 200, `Unexpected status ${res.status}`);
      const contentType = res.headers.get('Content-Type') || '';
      assert(contentType.startsWith('video/'), `Unexpected content-type ${contentType}`);
    });
  }

  await test('Cleanup project', async () => {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}`, { method: 'DELETE' });
    assert(res.ok, `Delete status ${res.status}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
