import { beforeEach, describe, expect, it, vi } from 'vitest';

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

  it('toasts the parsed GraphQL error and returns false', async () => {
    const result = await submitWrapper({
      fn: async () => {
        throw { response: { errors: [{ message: 'insufficient_credits' }] } };
      },
    });

    expect(result).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Not enough credits');
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
});
