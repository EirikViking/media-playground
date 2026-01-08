#!/usr/bin/env node
/**
 * Unified verification script for local development
 * Runs typecheck, build, and E2E tests sequentially
 */

import { execSync } from 'child_process';

const steps = [
    { name: 'Build', command: 'npm run build' },
    { name: 'E2E Tests', command: 'npm run verify:e2e' }
];

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║           Media Playground - Full Verification              ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

for (const step of steps) {
    console.log(`\n▶️  Running: ${step.name}...\n`);
    try {
        execSync(step.command, { stdio: 'inherit' });
        console.log(`\n✅ ${step.name} passed\n`);
    } catch (error) {
        console.error(`\n❌ ${step.name} failed`);
        process.exit(1);
    }
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║  ✅  All Verifications PASSED                                ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');
