import { spawn } from 'node:child_process';

import { localE2EEnv } from './e2e-env.mjs';

const SIMULATOR_PORT = 3999;

const SUPABASE = ['npx', '--yes', 'supabase@2.117.0'];

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

function startSimulator(env) {
  const child = spawn(process.execPath, ['e2e/services/simulator.mjs'], {
    env: { ...env, E2E_SIMULATOR_PORT: String(SIMULATOR_PORT) },
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

async function main() {
  let started = false;
  let simulator;
  let testCode = 1;
  try {
    await supabase(['start']);
    started = true;
    await supabase(['db', 'reset']);
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
    simulator = startSimulator(env);
    let ready = false;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const healthCheck = await fetch(`http://127.0.0.1:${SIMULATOR_PORT}/health`).catch(() => null);
      if (healthCheck?.ok) {
        ready = true;
        break;
      }
      if (simulator.exitCode != null) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!ready) {
      throw new Error('Local simulator health check failed');
    }
    testCode = await run('yarn', ['build'], { env });
    if (testCode === 0) {
      testCode = await run('yarn', ['playwright', 'test'], { env });
    }
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
