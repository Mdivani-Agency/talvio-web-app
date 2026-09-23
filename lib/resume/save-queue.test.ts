import { describe, expect, it, vi } from 'vitest';

import { createSaveRunner, mergeResumePatch } from './save-queue';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('mergeResumePatch', () => {
  it('keeps earlier fields when a later patch omits them', () => {
    expect(mergeResumePatch(
      { color: '#111111', label: 'Frontend' },
      { name: 'Ann', label: undefined },
    )).toEqual({ color: '#111111', label: 'Frontend', name: 'Ann' });
  });
});

describe('createSaveRunner', () => {
  it('saves a later edit after the in-flight revision and keeps that patch', async () => {
    const first = deferred<{ serverId: string; baseUpdatedAt: string }>();
    const save = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValueOnce({ serverId: 'resume-1', baseUpdatedAt: '2026-02-01T00:00:00.000Z' });
    const runner = createSaveRunner({
      merge: mergeResumePatch,
      save,
      isConflict: () => false,
    });

    runner.enqueue({ color: '#111111' });
    runner.enqueue({ name: 'Ann Owner' });

    expect(runner.getState().status).toBe('saving');
    expect(runner.getState().pending).toEqual({ name: 'Ann Owner' });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(
      { color: '#111111' },
      { serverId: undefined, baseUpdatedAt: undefined },
    );

    first.resolve({ serverId: 'resume-1', baseUpdatedAt: '2026-01-02T00:00:00.000Z' });
    await runner.whenIdle();

    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith(
      { name: 'Ann Owner' },
      { serverId: 'resume-1', baseUpdatedAt: '2026-01-02T00:00:00.000Z' },
    );
    expect(runner.getState()).toMatchObject({
      status: 'saved',
      serverId: 'resume-1',
      baseUpdatedAt: '2026-02-01T00:00:00.000Z',
      pending: undefined,
      inflight: undefined,
    });
  });

  it('keeps the unsaved patch on conflict and does not overwrite it', async () => {
    const save = vi.fn().mockRejectedValue(new Error('This resume changed in another session'));
    const onConflict = vi.fn().mockResolvedValue('2026-03-01T00:00:00.000Z');
    const runner = createSaveRunner({
      merge: mergeResumePatch,
      save,
      isConflict: (error) => error instanceof Error && error.message.includes('changed'),
      onConflict,
    });
    runner.seed({ serverId: 'resume-1', baseUpdatedAt: '2026-01-01T00:00:00.000Z' });

    runner.enqueue({ color: '#005BA2' });
    await expect(runner.whenIdle()).rejects.toThrow('This resume changed in another session');

    expect(runner.getState().status).toBe('conflict');
    expect(runner.getState().pending).toEqual({ color: '#005BA2' });
    expect(runner.getState().baseUpdatedAt).toBe('2026-03-01T00:00:00.000Z');
    expect(save).toHaveBeenCalledTimes(1);

    runner.enqueue({ name: 'Still local' });
    expect(save).toHaveBeenCalledTimes(1);
    expect(runner.getState().pending).toEqual({ color: '#005BA2', name: 'Still local' });
  });

  it('retries the pending patch with the refetched revision', async () => {
    const save = vi.fn()
      .mockRejectedValueOnce(new Error('This resume changed in another session'))
      .mockResolvedValueOnce({ serverId: 'resume-1', baseUpdatedAt: '2026-04-01T00:00:00.000Z' });
    const runner = createSaveRunner({
      merge: mergeResumePatch,
      save,
      isConflict: () => true,
      onConflict: async () => '2026-03-01T00:00:00.000Z',
    });
    runner.seed({ serverId: 'resume-1', baseUpdatedAt: '2026-01-01T00:00:00.000Z' });
    runner.enqueue({ label: 'Frontend' });
    await expect(runner.whenIdle()).rejects.toThrow('changed');

    await runner.retry();

    expect(save).toHaveBeenLastCalledWith(
      { label: 'Frontend' },
      { serverId: 'resume-1', baseUpdatedAt: '2026-03-01T00:00:00.000Z' },
    );
    expect(runner.getState().status).toBe('saved');
  });

  it('holds edits made while a PDF is generating and saves them afterwards', async () => {
    const save = vi.fn().mockResolvedValue({
      serverId: 'resume-1',
      baseUpdatedAt: '2026-05-01T00:00:00.000Z',
    });
    const runner = createSaveRunner({
      merge: mergeResumePatch,
      save,
      isConflict: () => false,
    });

    runner.beginGenerating();
    runner.enqueue({ color: '#005BA2' });
    expect(save).not.toHaveBeenCalled();
    expect(runner.getState().status).toBe('generating');

    await runner.finishGenerating(true);

    expect(save).toHaveBeenCalledWith(
      { color: '#005BA2' },
      { serverId: undefined, baseUpdatedAt: undefined },
    );
    expect(runner.getState().status).toBe('saved');
  });

  it('keeps pending edits when generation fails', async () => {
    const runner = createSaveRunner({
      merge: mergeResumePatch,
      save: vi.fn(),
      isConflict: () => false,
    });
    runner.beginGenerating();
    runner.enqueue({ name: 'Ann' });

    await runner.finishGenerating(false, 'Failed to upload resume PDF');

    expect(runner.getState().status).toBe('failed');
    expect(runner.getState().error).toBe('Failed to upload resume PDF');
    expect(runner.getState().pending).toEqual({ name: 'Ann' });
  });
});
