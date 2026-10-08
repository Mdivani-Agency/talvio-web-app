import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('sonner', () => ({ toast }));

import { submitWrapper } from './action.utils';

describe('submitWrapper', () => {
  beforeEach(() => {
    toast.success.mockReset();
    toast.error.mockReset();
    vi.stubEnv('NEXT_PUBLIC_FLAG_CREDIT_PURCHASE_UI', '');
  });

  it('toasts success, calls onSuccess, and returns true', async () => {
    const onSuccess = vi.fn();
    const result = await submitWrapper({
      fn: async () => ({ id: 'abc' }),
      onSuccess,
      successMessage: 'Saved',
    });

    expect(result).toBe(true);
    expect(toast.success).toHaveBeenCalledWith('Saved');
    expect(onSuccess).toHaveBeenCalledWith({ id: 'abc' });
    expect(toast.error).not.toHaveBeenCalled();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('toasts the renewal date, with no purchase link, when no PDF is left', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    let result: boolean;
    try {
      vi.setSystemTime(new Date('2026-10-06T12:00:00Z'));
      result = await submitWrapper({
        fn: async () => {
          throw { response: { errors: [{ message: 'insufficient_credits' }] } };
        },
      });
    } finally {
      vi.useRealTimers();
    }

    expect(result).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('No new resume PDFs left this month. You get 3 more on 1 November.');
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('adds the buy credits link when the purchase UI flag is on', async () => {
    vi.stubEnv('NEXT_PUBLIC_FLAG_CREDIT_PURCHASE_UI', 'true');
    const result = await submitWrapper({
      fn: async () => {
        throw { response: { errors: [{ message: 'insufficient_credits' }] } };
      },
    });

    expect(result).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringMatching(/^No new resume PDFs left this month\./),
      expect.objectContaining({
        action: expect.objectContaining({
          type: expect.anything(),
          props: expect.objectContaining({ href: '/account/credits' }),
        }),
      }),
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('uses errorMessage when provided', async () => {
    const result = await submitWrapper({
      fn: async () => {
        throw new Error('hidden');
      },
      errorMessage: 'Could not save',
    });

    expect(result).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Could not save');
  });

  it('rewrites the generate route error the same way', async () => {
    await submitWrapper({
      fn: async () => {
        throw new Error('Not enough credits');
      },
    });

    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/^No new resume PDFs left this month\./));
  });
});
