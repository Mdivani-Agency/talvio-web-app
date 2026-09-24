import { createServer } from 'node:http';

import { afterEach, describe, expect, it } from 'vitest';

import { startSimulator } from '../e2e/services/simulator.mjs';
import { confirmSimulatorReady } from '../scripts/e2e-simulator-ready.mjs';

const closers: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(closers.splice(0).map((close) => close()));
  delete process.env.E2E_SIMULATOR_TOKEN;
});

function listen(handler: (response: import('node:http').ServerResponse) => void) {
  const server = createServer((_request, response) => handler(response));
  return new Promise<{ port: number }>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('expected a tcp port');
      }
      closers.push(() => new Promise((done, fail) => server.close((error) => (error ? fail(error) : done()))));
      resolve({ port: address.port });
    });
  });
}

describe('owned simulator health', () => {
  it('accepts health only when the token matches and the child is alive', async () => {
    process.env.E2E_SIMULATOR_TOKEN = 'owned-run';
    const simulator = await startSimulator(0);
    closers.push(simulator.close);
    await confirmSimulatorReady({
      port: simulator.port,
      token: 'owned-run',
      isAlive: () => true,
      attempts: 5,
      delayMs: 10,
    });
    await expect(confirmSimulatorReady({
      port: simulator.port,
      token: 'someone-else',
      isAlive: () => true,
      attempts: 2,
      delayMs: 10,
    })).rejects.toThrow(/did not start/);
  });

  it('rejects a healthy occupant of the port when the spawned child has exited', async () => {
    const occupant = await listen((response) => {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ ok: true }));
    });
    await expect(confirmSimulatorReady({
      port: occupant.port,
      token: 'owned-run',
      isAlive: () => false,
      attempts: 3,
      delayMs: 10,
    })).rejects.toThrow(/exited before its health check/);
  });
});
