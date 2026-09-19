# Tech debt

## Auth

- **Deep-link callback after the account gate.** `app/account/layout.tsx`
  always redirects unauthenticated users to `callbackURL=/account`, so a
  request to `/account/documents` (or any other account subroute) loses its
  destination after sign-in. The auth callback already accepts an arbitrary
  `next` path. Preserve `pathname + search` from the original request when
  building the sign-in redirect.
