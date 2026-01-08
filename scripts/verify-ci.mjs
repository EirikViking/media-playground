#!/usr/bin/env node
/**
 * CI Verification Orchestrator
 * Builds and starts servers, runs tests, then cleans up
 * 
 * Features:
 * - Automatic free port selection
 * - Process output logging to .tmp/
 * - Robust cleanup on all exit paths
 * - Detailed diagnostics on failure
 */

import { spawn, execSync } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';
import { createServer } from 'net';
import { mkdirSync, existsSync, rmSync, createWriteStream } from 'fs';
import { join } from 'path';

const WORKER_PORT = 8787;
const FRONTEND_PORT_START = 5173;
const FRONTEND_PORT_END = 5190;
const MAX_WAIT_MS = 90000;
const POLL_INTERVAL_MS = 1000;

const processes = [];
const processOutputs = new Map();
const logStreams = new Map();
const TMP_DIR = '.tmp';

// Ensure .tmp directory exists and is clean
if (existsSync(TMP_DIR)) {
    rmSync(TMP_DIR, { recursive: true, force: true });
}
mkdirSync(TMP_DIR, { recursive: true });

function log(emoji, message) {
    const timestamp = new Date().toISOString().slice(11, 19);
    console.log(`[${timestamp}] ${emoji} ${message}`);
}

/**
 * Find a free port by attempting to bind
 */
async function findFreePort(start, end) {
    for (let port = start; port <= end; port++) {
        if (await isPortFree(port)) {
            return port;
        }
    }
    throw new Error(`No free ports found in range ${start}-${end}`);
}

function isPortFree(port) {
    return new Promise((resolve) => {
        const server = createServer();
        server.once('error', () => resolve(false));
        server.once('listening', () => {
            server.close();
            resolve(true);
        });
        server.listen(port, '127.0.0.1');
    });
}

function cleanup() {
    log('🧹', 'Cleaning up processes...');

    // Close all log streams
    for (const stream of logStreams.values()) {
        try {
            stream.end();
        } catch (e) {
            // Ignore
        }
    }

    // Kill all spawned processes
    for (const proc of processes) {
        try {
            if (process.platform === 'win32') {
                try {
                    execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
                } catch (e) {
                    // Process may already be dead
                }
            } else {
                process.kill(-proc.pid, 'SIGKILL');
            }
        } catch (e) {
            // Process may already be dead
        }
    }
    log('✅', 'Cleanup complete');
}

// Register cleanup handlers for all exit paths
process.on('SIGINT', () => {
    log('⚠️', 'Received SIGINT');
    cleanup();
    process.exit(1);
});

process.on('SIGTERM', () => {
    log('⚠️', 'Received SIGTERM');
    cleanup();
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    log('❌', `Uncaught exception: ${error.message}`);
    cleanup();
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    log('❌', `Unhandled rejection: ${reason}`);
    cleanup();
    process.exit(1);
});

async function waitForEndpoint(url, name, expectedContent = null) {
    log('⏳', `Waiting for ${name} at ${url}...`);
    const startTime = Date.now();
    let lastError = '';

    while (Date.now() - startTime < MAX_WAIT_MS) {
        try {
            const controller = new AbortController();
            const timeoutId = global.setTimeout(() => controller.abort(), 5000);

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (expectedContent) {
                if (response.status === 200) {
                    const contentType = response.headers.get('content-type') || '';
                    if (contentType.includes('text/html')) {
                        const text = await response.text();
                        if (text.includes(expectedContent)) {
                            log('✅', `${name} is ready! (${Date.now() - startTime}ms)`);
                            return true;
                        }
                    }
                }
            } else if (response.ok || response.status < 500) {
                log('✅', `${name} is ready! (${Date.now() - startTime}ms)`);
                return true;
            }
            lastError = `Status: ${response.status}`;
        } catch (e) {
            lastError = e.message;
        }

        // Check if any process has exited
        for (const proc of processes) {
            if (proc.exitCode !== null) {
                const output = processOutputs.get(proc.pid) || '';
                throw new Error(`Process exited unexpectedly with code ${proc.exitCode}\nLast output:\n${output.slice(-2000)}`);
            }
        }

        await sleep(POLL_INTERVAL_MS);
    }

    throw new Error(`Timeout waiting for ${name} at ${url}. Last error: ${lastError}`);
}

function startProcess(command, args, cwd, name, env = {}) {
    log('🚀', `Starting ${name}: ${command} ${args.join(' ')} (cwd: ${cwd})`);

    const proc = spawn(command, args, {
        cwd,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, ...env, FORCE_COLOR: '1' },
        detached: process.platform !== 'win32'
    });

    processes.push(proc);
    processOutputs.set(proc.pid, '');

    // Create log file for this process
    const logFile = join(TMP_DIR, `${name.toLowerCase().replace(/\s/g, '-')}.log`);
    const logStream = createWriteStream(logFile);
    logStreams.set(proc.pid, logStream);

    const appendOutput = (data) => {
        const text = data.toString();
        const current = processOutputs.get(proc.pid) || '';
        processOutputs.set(proc.pid, (current + text).slice(-10000));

        // Write to log file
        logStream.write(text);

        // Print to console with prefix (only important lines to avoid noise)
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length > 0 && lines.length < 5) {
            lines.forEach(line => console.log(`  [${name}] ${line}`));
        }
    };

    proc.stdout?.on('data', appendOutput);
    proc.stderr?.on('data', appendOutput);

    proc.on('error', (error) => {
        log('❌', `${name} error: ${error.message}`);
    });

    proc.on('exit', (code, signal) => {
        if (code !== null && code !== 0) {
            log('❌', `${name} exited with code ${code}`);
        } else if (signal) {
            log('⚠️', `${name} killed by signal ${signal}`);
        }
        // Close log stream
        const stream = logStreams.get(proc.pid);
        if (stream) {
            stream.end();
            logStreams.delete(proc.pid);
        }
    });

    return proc;
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
    log('ℹ️', `Platform: ${process.platform}`);
    log('ℹ️', `Node: ${process.version}`);

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

        // Step 3: Find a free port for frontend
        log('🔍', 'Finding free port for frontend...');
        const FRONTEND_PORT = await findFreePort(FRONTEND_PORT_START, FRONTEND_PORT_END);
        const FRONTEND_URL = `http://127.0.0.1:${FRONTEND_PORT}`;
        const WORKER_URL = `http://127.0.0.1:${WORKER_PORT}`;

        log('✅', `Using frontend port: ${FRONTEND_PORT}`);
        log('✅', `Using worker port: ${WORKER_PORT}`);

        // Step 4: Build frontend (critical for reliable CI)
        log('🔨', 'Building frontend...');
        execSync('npm run build', {
            stdio: 'inherit',
            env: { ...process.env, VITE_API_BASE: WORKER_URL }
        });

        // Step 5: Start worker dev server
        startProcess('npm', ['run', 'dev', '--', '--port', WORKER_PORT.toString()], 'worker', 'Worker');

        // Give worker a moment to start binding
        await sleep(2000);

        // Step 6: Start frontend preview server
        startProcess(
            'npm',
            ['run', 'preview', '--', '--host', '127.0.0.1', '--port', FRONTEND_PORT.toString(), '--strictPort'],
            '.',
            'Frontend'
        );

        // Step 7: Wait for both servers to be ready
        await waitForEndpoint(`${WORKER_URL}/api/health`, 'Worker API');
        await waitForEndpoint(FRONTEND_URL, 'Frontend', '<div id="root">');

        console.log('');
        log('🧪', 'All servers ready. Running tests...');
        console.log('');

        // Step 8: Run worker verification
        console.log('━'.repeat(60));
        console.log('  WORKER API TESTS');
        console.log('━'.repeat(60));
        await runCommand('node', ['scripts/verify-worker.mjs'], {
            VERIFY_API_BASE: WORKER_URL
        });

        // Step 9: Run Playwright UI tests
        console.log('');
        console.log('━'.repeat(60));
        console.log('  PLAYWRIGHT UI TESTS');
        console.log('━'.repeat(60));
        await runCommand('npx', ['playwright', 'test', '--reporter=list'], {
            PLAYWRIGHT_BASE_URL: FRONTEND_URL,
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

        // Print last output from all processes
        console.log('\n--- Process Outputs (last 200 lines each) ---');
        for (const [pid, output] of processOutputs) {
            if (output) {
                const lines = output.split('\n').slice(-200);
                console.log(`\nPID ${pid}:\n${lines.join('\n')}`);
            }
        }

        // Print log file locations
        console.log(`\n📁 Full logs available in: ${TMP_DIR}/`);
        console.log('');

        cleanup();
        process.exit(1);
    }
}

main();
