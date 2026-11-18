import { featureFlags } from '@/lib/flags';
import { BETA_TAG } from '@/lib/public-nav';

/** The Beta tag beside the logo, shown while beta mode is on. 12px by design, so exempt from the 16px text check. */
export const BetaTag = () => {
  if (!featureFlags().betaMode) {
    return null;
  }
  return (
    <span data-allow-small-text className="rounded-md bg-popover px-2 py-0.5 text-xs font-semibold text-foreground dark:bg-accent">
      {BETA_TAG}
    </span>
  );
};
