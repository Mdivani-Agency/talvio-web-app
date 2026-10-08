import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { FLOW_USER_ID, savedAccount } from '../../../test/fixtures/flow';

import { seedAccountQuery } from './use-save-profile';

describe('seedAccountQuery', () => {
  it('writes the saved profile into the account cache', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['account', FLOW_USER_ID], null);

    seedAccountQuery(queryClient, FLOW_USER_ID, savedAccount);

    expect(queryClient.getQueryData(['account', FLOW_USER_ID])).toEqual(savedAccount);
  });
});
