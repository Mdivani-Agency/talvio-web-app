# Tech debt

## Frontend

- **Remove unnecessary `useEffect` calls.** Forms and template-response
  surfaces already treat `useEffect` as an anti-pattern (`form.Subscribe` /
  `useStore`, derive during render). Audit the remaining app effects and
  replace them with event handlers, derived state, or TanStack store
  subscriptions unless the work is a true external subscription (auth
  listener, `matchMedia`, IntersectionObserver). Current call sites:
  `app/resume/views/resume-preview.tsx`,
  `app/resume/components/resume-preview.tsx`,
  `app/resume/providers/state-provider.tsx`,
  `app/account/providers/state-provider.tsx`,
  `app/account/create/views/ordered-list.tsx`,
  `app/account/documents/resume-image.tsx`,
  `lib/providers/session-provider.tsx`,
  `hooks/use-responsive-item-limit.ts`,
  `components/modals/sort-modal.tsx`,
  `components/views/sticky-header.tsx`,
  `components/ui/calendar.tsx`,
  `components/ui/auto-complete-input.tsx`,
  `components/ui/date-picker.tsx`.

## Auth

- **Deep-link callback after the account gate.** `app/account/layout.tsx`
  always redirects unauthenticated users to `callbackURL=/account`, so a
  request to `/account/documents` (or any other account subroute) loses its
  destination after sign-in. The auth callback already accepts an arbitrary
  `next` path. Preserve `pathname + search` from the original request when
  building the sign-in redirect.
