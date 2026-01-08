#!/usr/bin/env node
/**
 * CI Verification Orchestrator
 * Builds and starts servers, runs tests, then cleans up
 * 
 * Usage:
 *   node scripts/verify-ci.mjs
 */

import { spawn, execSync } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';

const WORKER_PORT = 8787;
const FRONTEND_PORT = 5174;
const WORKER_URL = `http://127.0.0.1:${WORKER_PORT}`;
const FRONTEND_URL = `http://127.0.0.1:${FRONTEND_PORT}`;
const MAX_WAIT_MS = 90000;
const POLL_INTERVAL_MS = 1000;

const processes = [];
const processOutputs = new Map();

function log(emoji, message) {
    const timestamp = new Date().toISOString().slice(11, 19);
    console.log(`[${timestamp}] ${emoji} ${message}`);
}

function cleanup() {
    log('🧹', 'Cleaning up processes...');
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
                // Strict check for frontend: 200 OK + correct content type + specific body content
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
                // Loose check for API readiness (accepts success or functional error)
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

    const appendOutput = (data) => {
        const text = data.toString();
        const current = processOutputs.get(proc.pid) || '';
        // Keep last 10KB
        processOutputs.set(proc.pid, (current + text).slice(-10000));
        // Print to console with prefix
        text.split('\n').filter(line => line.trim()).forEach(line => {
            console.log(`  [${name}] ${line}`);
        });
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

        // Step 3: Build frontend (critical for reliable CI)
        log('🔨', 'Building frontend...');
        execSync('npm run build', {
            stdio: 'inherit',
            env: { ...process.env, VITE_API_BASE: WORKER_URL }
        });

        // Step 4: Start worker dev server
        startProcess('npm', ['run', 'dev', '--', '--port', WORKER_PORT.toString()], 'worker', 'Worker');

        // Give worker a moment to start binding
        await sleep(2000);

        // Step 5: Start frontend preview server (more reliable than dev in CI)
        startProcess(
            'npm',
            ['run', 'preview', '--', '--host', '127.0.0.1', '--port', FRONTEND_PORT.toString(), '--strictPort'],
            '.',
            'Frontend'
        );

        // Step 6: Wait for both servers to be ready
        await waitForEndpoint(`${WORKER_URL}/api/health`, 'Worker API');
        await waitForEndpoint(FRONTEND_URL, 'Frontend', '<div id="root">');

        console.log('');
        log('🧪', 'All servers ready. Running tests...');
        console.log('');

        // Step 7: Run worker verification
        console.log('━'.repeat(60));
        console.log('  WORKER API TESTS');
        console.log('━'.repeat(60));
        await runCommand('node', ['scripts/verify-worker.mjs'], {
            VERIFY_API_BASE: WORKER_URL
        });

        // Step 8: Run Playwright UI tests
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

        // Print last output from all processes
        console.log('\n--- Process Outputs ---');
        for (const [pid, output] of processOutputs) {
            if (output) {
                console.log(`\nPID ${pid}:\n${output.slice(-2000)}`);
            }
        }
        console.log('');

        cleanup();
        process.exit(1);
    }
}

main();
