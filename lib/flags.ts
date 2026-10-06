/**
 * Release flags (MDI-320). Environment variables only; there is no runtime flag service.
 * A flag changes with a redeploy. Unset or unrecognised values fall back to the beta defaults.
 *
 * Each variable is read by its literal name so Next.js inlines it into client bundles.
 */
export type FeatureFlags = {
  /** Beta labelling and the free monthly allowance as the only credit source. Declared by MDI-398 for the MDI-320 beta; no code reads it yet. */
  betaMode: boolean;
  /** Serves `/pricing` and lists it in the sitemap. Off: `/pricing` redirects to the homepage allowance section. */
  plansPage: boolean;
  /**
   * Shows credit purchase entry points ("Buy credits", "Buy More", "Upgrade Now").
   * Keep it off until the purchase pages ship: `/account/credits` and `/account/upgrade` have no page, so turning it on links to a 404.
   */
  creditPurchaseUi: boolean;
};

export type FeatureFlagEnv = {
  NEXT_PUBLIC_FLAG_BETA_MODE?: string;
  NEXT_PUBLIC_FLAG_PLANS_PAGE?: string;
  NEXT_PUBLIC_FLAG_CREDIT_PURCHASE_UI?: string;
};

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  betaMode: true,
  plansPage: false,
  creditPurchaseUi: false,
};

function parseFlag(value: string | undefined, fallback: boolean): boolean {
  switch (value?.trim().toLowerCase()) {
    case 'true':
    case '1':
    case 'on':
      return true;
    case 'false':
    case '0':
    case 'off':
      return false;
    default:
      return fallback;
  }
}

function processFlagEnv(): FeatureFlagEnv {
  return {
    NEXT_PUBLIC_FLAG_BETA_MODE: process.env.NEXT_PUBLIC_FLAG_BETA_MODE,
    NEXT_PUBLIC_FLAG_PLANS_PAGE: process.env.NEXT_PUBLIC_FLAG_PLANS_PAGE,
    NEXT_PUBLIC_FLAG_CREDIT_PURCHASE_UI: process.env.NEXT_PUBLIC_FLAG_CREDIT_PURCHASE_UI,
  };
}

export function featureFlags(env: FeatureFlagEnv = processFlagEnv()): FeatureFlags {
  return {
    betaMode: parseFlag(env.NEXT_PUBLIC_FLAG_BETA_MODE, DEFAULT_FEATURE_FLAGS.betaMode),
    plansPage: parseFlag(env.NEXT_PUBLIC_FLAG_PLANS_PAGE, DEFAULT_FEATURE_FLAGS.plansPage),
    creditPurchaseUi: parseFlag(env.NEXT_PUBLIC_FLAG_CREDIT_PURCHASE_UI, DEFAULT_FEATURE_FLAGS.creditPurchaseUi),
  };
}
