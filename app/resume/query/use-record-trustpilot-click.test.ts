import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockGraphqlSdk } from '@/test/mocks/graphql-client';

vi.mock('@/lib/graphql-client', async () => {
  const actual = await vi.importActual<typeof import('@/test/mocks/graphql-client')>(
    '@/test/mocks/graphql-client',
  );
  return actual;
});

import { recordTrustpilotClick } from './use-record-trustpilot-click';

describe('recordTrustpilotClick', () => {
  beforeEach(() => {
    mockGraphqlSdk.Record_Trustpilot_Click = vi.fn();
  });

  it('records the click and returns an empty id', async () => {
    mockGraphqlSdk.Record_Trustpilot_Click = vi.fn().mockResolvedValue({ record_trustpilot_click: null });
    await expect(recordTrustpilotClick()).resolves.toEqual({ id: '' });
    expect(mockGraphqlSdk.Record_Trustpilot_Click).toHaveBeenCalledTimes(1);
  });

  it('passes a failed call to the caller', async () => {
    mockGraphqlSdk.Record_Trustpilot_Click = vi.fn().mockRejectedValue(new Error('offline'));
    await expect(recordTrustpilotClick()).rejects.toThrow('offline');
  });
});
