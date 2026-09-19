# Tech debt

## Frontend

- **Date picker and form date conversion use local time.** Profile adapters
  now persist `yyyy-MM-dd` from the UTC calendar date, but
  `components/ui/date-picker.tsx` still does `new Date(value)` /
  `toISOString()`, and account experience/education forms convert picker
  values with `new Date(startDate).toISOString()`. West-of-UTC browsers
  can still *display* the previous day. Read/write UTC date parts in the
  picker and stop constructing local `Date` objects from date-only strings.

- **Paginate `ProfileByUser` child collections.** Collections are capped at
  `first: 200`. A profile with more skills/tools/links silently drops rows
  on load (and the next save cannot update the omitted ones). Surface
  `hasNextPage` and fetch remaining pages, or raise per-table limits.

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

## GraphQL

- **Regenerate `lib/graphql/schema.graphql` from a live pg_graphql endpoint.**
  The snapshot is still hand-maintained (`resume_typeFilter` was added to
  match the enum column). Run `yarn codegen:from-supabase` after a local
  `db:reset` and commit the live AST so insert/update inputs and filters
  cannot drift.

## Auth

- **Deep-link callback after the account gate.** `app/account/layout.tsx`
  always redirects unauthenticated users to `callbackURL=/account`, so a
  request to `/account/documents` (or any other account subroute) loses its
  destination after sign-in. The auth callback already accepts an arbitrary
  `next` path. Preserve `pathname + search` from the original request when
  building the sign-in redirect.
