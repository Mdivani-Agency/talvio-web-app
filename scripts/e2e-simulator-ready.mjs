export async function confirmSimulatorReady({
  port,
  token,
  isAlive,
  attempts = 20,
  delayMs = 100,
}) {
  let sawForeignHealth = false;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (!isAlive()) {
      throw new Error('Local simulator exited before its health check succeeded');
    }
    const healthCheck = await fetch(`http://127.0.0.1:${port}/health`).catch(() => null);
    if (healthCheck?.ok) {
      const body = await healthCheck.json().catch(() => null);
      if (body?.token === token && isAlive()) {
        return;
      }
      sawForeignHealth = true;
    }
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  if (!isAlive()) {
    throw new Error('Local simulator exited before its health check succeeded');
  }
  if (sawForeignHealth) {
    throw new Error(`Port ${port} answered /health from a process this run did not start`);
  }
  throw new Error('Local simulator health check failed');
}
