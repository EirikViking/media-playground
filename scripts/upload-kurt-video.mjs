import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'https://media-playground-api.cromkake.workers.dev';
const PROJECT_TITLE = 'About Kurt Media';
const VIDEO_PATH = path.resolve(__dirname, '../public/video/grok-video-0936f8c7-e858-4d35-a7c2-da217fbde90b.mp4');
const THUMB_PATH = path.resolve(__dirname, '../public/beervan.png');

const jsonHeaders = { 'Content-Type': 'application/json' };

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }
  return data;
};

const createProject = async () => {
  const payload = { title: PROJECT_TITLE, data: '{}' };
  const data = await request(`${API_BASE}/api/projects`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  return data?.id;
};

const uploadFile = async (projectId, assetId, kind, filePath, contentType) => {
  const fileBuffer = fs.readFileSync(filePath);
  const url = `${API_BASE}/api/upload/${projectId}/${assetId}/${kind}`;
  await request(url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Content-Length': fileBuffer.byteLength.toString(),
    },
    body: fileBuffer,
  });
  return fileBuffer.byteLength;
};

const commitAsset = async (projectId, assetId, fileName, byteSize) => {
  const payload = {
    assetId,
    contentType: 'video/mp4',
    byteSize,
    width: 0,
    height: 0,
    fileName,
    createdAt: new Date().toISOString(),
  };
  await request(`${API_BASE}/api/projects/${projectId}/assets/commit`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
};

const main = async () => {
  if (!fs.existsSync(VIDEO_PATH)) {
    throw new Error(`Video file not found: ${VIDEO_PATH}`);
  }
  if (!fs.existsSync(THUMB_PATH)) {
    throw new Error(`Thumb file not found: ${THUMB_PATH}`);
  }

  const projectId = await createProject();
  if (!projectId) {
    throw new Error('Failed to create project');
  }

  const assetId = crypto.randomUUID();
  const videoSize = await uploadFile(projectId, assetId, 'original', VIDEO_PATH, 'video/mp4');
  await uploadFile(projectId, assetId, 'thumb', THUMB_PATH, 'image/png');
  await commitAsset(projectId, assetId, path.basename(VIDEO_PATH), videoSize);

  console.log('Upload complete.');
  console.log(`PROJECT_ID=${projectId}`);
  console.log(`ASSET_ID=${assetId}`);
};

main().catch((err) => {
  console.error('Upload failed:', err.message);
  process.exit(1);
});
