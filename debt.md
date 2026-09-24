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

## Resume PDF

- **Dashboard family pagination is client-side.** The list uses
  `RESUME_PAGE_SIZE` (10) plus a Load more bump, and fetches a missing
  parent when an open draft's source is off the page. Families are still
  grouped in the browser. Paginate parent families server-side
  (`source_resume_id` is null or `pdf_url` is not null) and pull the open
  draft via the reverse `resumesCollection` relation.

- **Generated lineage children look unrelated.** A generated draft that
  keeps `source_resume_id` renders as its own "PDF ready" card with no
  "v2 of {label}" hint. Group by root or show lineage on the card.

