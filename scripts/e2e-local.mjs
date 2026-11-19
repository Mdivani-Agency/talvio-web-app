import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

import { assertReportFile } from './assert-e2e-results.mjs';
import { localE2EEnv } from './e2e-env.mjs';
import { confirmSimulatorReady } from './e2e-simulator-ready.mjs';

const SIMULATOR_PORT = 3999;

// CI runs the two halves as parallel jobs: `--db` runs only the database tests and `--e2e` only the browser suite.
// With neither flag, a local run does both, database tests first.
export function launcherSteps(args) {
  const db = args.includes('--db');
  const e2e = args.includes('--e2e');
  if (db && e2e) {
    throw new Error('Pass --db or --e2e, not both. Pass neither to run both.');
  }
  return { dbTests: !e2e, playwright: !db };
}

// CI installs the pinned CLI once (supabase/setup-cli) and sets E2E_SUPABASE_CLI; local runs fall back to npx.
// The variable is a command line, so `supabase` and `npx supabase@2.117.0` both work.
const SUPABASE = process.env.E2E_SUPABASE_CLI?.trim()
  ? process.env.E2E_SUPABASE_CLI.trim().split(/\s+/)
  : ['npx', '--yes', 'supabase@2.117.0'];

// The tests use Postgres, Auth, the REST/GraphQL gateway and the mail catcher (mailpit).
// Everything else only adds image pulls and startup time. The pooler is already off in config.toml.
const UNUSED_SERVICES = [
  'studio',
  'postgres-meta',
  'imgproxy',
  'realtime',
  'edge-runtime',
  'logflare',
  'vector',
  'storage-api',
];

function run(command, args, { env = process.env, cwd = process.cwd() } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`${command} exited from ${signal}`));
        return;
      }
      resolve(code ?? 1);
    });
  });
}

function capture(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `${command} exited ${code}`));
        return;
      }
      resolve(stdout);
    });
  });
}

function parseStatus(text) {
  const status = {};
  for (const line of text.split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) {
      continue;
    }
    status[match[1]] = match[2].replace(/^"|"$/g, '');
  }
  return status;
}

async function supabase(args, options) {
  const code = await run(SUPABASE[0], [...SUPABASE.slice(1), ...args], options);
  if (code !== 0) {
    throw new Error(`supabase ${args.join(' ')} exited ${code}`);
  }
}

function startSimulator(env, token) {
  const child = spawn(process.execPath, ['e2e/services/simulator.mjs'], {
    env: {
      ...env,
      E2E_SIMULATOR_PORT: String(SIMULATOR_PORT),
      E2E_SIMULATOR_TOKEN: token,
    },
    stdio: 'inherit',
  });
  return child;
}

async function stopSimulator(child) {
  if (!child || child.exitCode != null || child.signalCode) {
    return;
  }
  child.kill('SIGTERM');
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, 2000);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

/** Builds the app against the running stack and runs Playwright. `onSimulator` receives the simulator so cleanup can stop it. */
async function runBrowserSuite(onSimulator) {
  const statusText = await capture(SUPABASE[0], [...SUPABASE.slice(1), 'status', '-o', 'env']);
  const env = {
    ...process.env,
    ...localE2EEnv(parseStatus(statusText)),
    CI: process.env.CI ?? '1',
  };
  const health = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`);
  if (!health.ok) {
    throw new Error(`Supabase auth health check failed: ${health.status}`);
  }
  const simulatorToken = randomUUID();
  const simulator = startSimulator(env, simulatorToken);
  onSimulator(simulator);
  await confirmSimulatorReady({
    port: SIMULATOR_PORT,
    token: simulatorToken,
    isAlive: () => simulator.exitCode == null && simulator.signalCode == null,
  });
  let testCode = await run('yarn', ['build'], { env });
  if (testCode === 0) {
    testCode = await run('yarn', ['playwright', 'test'], { env });
  }
  if (testCode === 0) {
    try {
      assertReportFile('playwright-report/results.json', 'e2e/required-results.json');
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      testCode = 1;
    }
  }
  return testCode;
}

async function main() {
  const steps = launcherSteps(process.argv.slice(2));
  let started = false;
  let simulator;
  let testCode = 1;
  try {
    await supabase(['start', '-x', UNUSED_SERVICES.join(',')]);
    started = true;
    await supabase(['db', 'reset']);
    if (steps.dbTests) {
      await supabase(['test', 'db']);
    }
    testCode = steps.playwright ? await runBrowserSuite((child) => (simulator = child)) : 0;
  } finally {
    try {
      await stopSimulator(simulator);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      if (testCode === 0) {
        testCode = 1;
      }
    }
    if (started) {
      try {
        await supabase(['stop', '--no-backup']);
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        if (testCode === 0) {
          testCode = 1;
        }
      }
    }
  }
  process.exit(testCode);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
