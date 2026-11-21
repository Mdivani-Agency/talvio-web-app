import { AccountSkeleton } from './views/account-skeleton';

/** Route-level loading for `/account`: the page's shape in grey inside the account shell (MDI-671). */
export default function AccountLoadingPage() {
  return <AccountSkeleton />;
}
