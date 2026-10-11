import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_FEATURE_FLAGS, featureFlags } from './flags';

describe('feature flags', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to beta on, plans page off, purchase UI off and Improve with AI off', () => {
    const defaults = { betaMode: true, plansPage: false, creditPurchaseUi: false, resumeAiImprove: false };
    expect(featureFlags({})).toEqual(defaults);
    expect(DEFAULT_FEATURE_FLAGS).toEqual(defaults);
  });

  it('turns every flag on or off from its variable', () => {
    expect(
      featureFlags({
        NEXT_PUBLIC_FLAG_BETA_MODE: 'false',
        NEXT_PUBLIC_FLAG_PLANS_PAGE: 'true',
        NEXT_PUBLIC_FLAG_CREDIT_PURCHASE_UI: '1',
        NEXT_PUBLIC_FLAG_RESUME_AI_IMPROVE: 'on',
      }),
    ).toEqual({ betaMode: false, plansPage: true, creditPurchaseUi: true, resumeAiImprove: true });
    expect(featureFlags({ NEXT_PUBLIC_FLAG_PLANS_PAGE: ' ON ', NEXT_PUBLIC_FLAG_BETA_MODE: '0' })).toMatchObject({
      betaMode: false,
      plansPage: true,
    });
  });

  it('falls back to the default for an empty or unknown value', () => {
    expect(featureFlags({ NEXT_PUBLIC_FLAG_PLANS_PAGE: '', NEXT_PUBLIC_FLAG_CREDIT_PURCHASE_UI: 'yes please' })).toEqual(
      DEFAULT_FEATURE_FLAGS,
    );
  });

  it('reads process.env when no env is given', () => {
    vi.stubEnv('NEXT_PUBLIC_FLAG_PLANS_PAGE', 'true');
    expect(featureFlags().plansPage).toBe(true);
  });
});
