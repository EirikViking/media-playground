#!/usr/bin/env node
/**
 * CI Verification Orchestrator
 * Starts worker and frontend dev servers, runs tests, then cleans up
 * 
 * Usage:
 *   node scripts/verify-ci.mjs
 */

import { spawn, execSync } from 'child_process';
import { setTimeout } from 'timers/promises';

const WORKER_PORT = 8787;
const FRONTEND_PORT = 5173;
const WORKER_URL = `http://127.0.0.1:${WORKER_PORT}`;
const FRONTEND_URL = `http://127.0.0.1:${FRONTEND_PORT}`;
const MAX_WAIT_MS = 60000;
const POLL_INTERVAL_MS = 1000;

const processes = [];

function log(emoji, message) {
    console.log(`${emoji} ${message}`);
}

function cleanup() {
    log('🧹', 'Cleaning up processes...');
    for (const proc of processes) {
        try {
            // Kill process group on Windows
            if (process.platform === 'win32') {
                execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
            } else {
                proc.kill('SIGTERM');
            }
        } catch (e) {
            // Process may already be dead
        }
    }
}

process.on('SIGINT', () => {
    cleanup();
    process.exit(1);
});

process.on('exit', cleanup);

async function waitForEndpoint(url, name) {
    log('⏳', `Waiting for ${name} at ${url}...`);
    const startTime = Date.now();

    while (Date.now() - startTime < MAX_WAIT_MS) {
        try {
            const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
            if (response.ok || response.status < 500) {
                log('✅', `${name} is ready!`);
                return true;
            }
        } catch (e) {
            // Not ready yet
        }
        await setTimeout(POLL_INTERVAL_MS);
    }

    throw new Error(`Timeout waiting for ${name} at ${url}`);
}

function startProcess(command, args, cwd, name) {
    return new Promise((resolve, reject) => {
        log('🚀', `Starting ${name}: ${command} ${args.join(' ')}`);

        const proc = spawn(command, args, {
            cwd,
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env, FORCE_COLOR: '1' }
        });

        processes.push(proc);

        let output = '';

        proc.stdout?.on('data', (data) => {
            output += data.toString();
            // Check for ready signals
            if (output.includes('ready') || output.includes('Local:') || output.includes('listening')) {
                resolve(proc);
            }
        });

        proc.stderr?.on('data', (data) => {
            output += data.toString();
        });

        proc.on('error', (error) => {
            reject(new Error(`Failed to start ${name}: ${error.message}`));
        });

        proc.on('exit', (code) => {
            if (code !== 0 && code !== null) {
                reject(new Error(`${name} exited with code ${code}\nOutput: ${output.slice(-500)}`));
            }
        });

        // Resolve after a timeout if we haven't gotten a ready signal
        setTimeout(5000).then(() => resolve(proc));
    });
}

function runCommand(command, args, env = {}) {
    return new Promise((resolve, reject) => {
        log('▶️', `Running: ${command} ${args.join(' ')}`);

        const proc = spawn(command, args, {
            shell: true,
            stdio: 'inherit',
            env: { ...process.env, ...env }
        });

        proc.on('exit', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });

        proc.on('error', reject);
    });
}

async function main() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║     Media Playground E2E Verification Suite                  ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

    const isCI = process.env.CI === 'true';
    log('ℹ️', `Environment: ${isCI ? 'CI' : 'Local'}`);

    try {
        // Step 1: Install worker dependencies
        log('📦', 'Installing worker dependencies...');
        execSync('npm install', { cwd: 'worker', stdio: 'inherit' });

        // Step 2: Run worker migrations for local D1
        log('🗄️', 'Running D1 migrations...');
        try {
            execSync('npm run db:migrate:local', { cwd: 'worker', stdio: 'inherit' });
        } catch (e) {
            log('⚠️', 'Migration may have already been applied');
        }

        // Step 3: Start worker dev server
        await startProcess('npm', ['run', 'dev'], 'worker', 'Worker');

        // Step 4: Start frontend dev server
        await startProcess('npm', ['run', 'dev', '--', '--port', FRONTEND_PORT.toString()], '.', 'Frontend');

        // Step 5: Wait for both servers to be ready
        await waitForEndpoint(`${WORKER_URL}/api/health`, 'Worker API');
        await waitForEndpoint(FRONTEND_URL, 'Frontend');

        console.log('');
        log('🧪', 'All servers ready. Running tests...');
        console.log('');

        // Step 6: Run worker verification
        console.log('━'.repeat(60));
        console.log('  WORKER API TESTS');
        console.log('━'.repeat(60));
        await runCommand('node', ['scripts/verify-worker.mjs'], {
            VERIFY_API_BASE: WORKER_URL
        });

        // Step 7: Run Playwright UI tests
        console.log('');
        console.log('━'.repeat(60));
        console.log('  PLAYWRIGHT UI TESTS');
        console.log('━'.repeat(60));
        await runCommand('npx', ['playwright', 'test', '--reporter=list'], {
            VERIFY_WEB_BASE: FRONTEND_URL,
            VERIFY_API_BASE: WORKER_URL
        });

        console.log('');
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║  ✅  ALL VERIFICATIONS PASSED                                ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log('');

        cleanup();
        process.exit(0);

    } catch (error) {
        console.log('');
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║  ❌  VERIFICATION FAILED                                     ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log('');
        console.error('Error:', error.message);
        console.log('');

        cleanup();
        process.exit(1);
    }
}

main();
