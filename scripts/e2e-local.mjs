import { spawn } from 'node:child_process';

import { localE2EEnv } from './e2e-env.mjs';

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

async function main() {
  let started = false;
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
    testCode = await run('yarn', ['build'], { env });
    if (testCode !== 0) {
      return;
    }
    testCode = await run('yarn', ['playwright', 'test'], { env });
  } finally {
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
