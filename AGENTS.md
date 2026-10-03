<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project rules

The rule files in `.cursor/rules/` are the source of truth for every agent, not only Cursor. This file mirrors them: always-on rules are summarised below, and each summary names the file that holds the full text. When a summary and its rule file disagree, the rule file wins.

If a rule points to a file that does not exist in this repository, say so and follow the nearest existing pattern instead of creating the missing file.

## Always-on rules

### Frontend stack (`.cursor/rules/main.mdc`)

- Prefer these libraries for frontend components: `@tanstack/react-query`, `@tanstack/react-form`, `@tanstack/react-table`, shadcn, `date-fns`, `lucide-react`, `zod`.
- Always use Tailwind for styles.

### Linear workflow (`.cursor/rules/linear.mdc`)

- This repository belongs to the Linear project `Talvio` (project id `1483a14a626b`). Use that project when creating or updating issues.
- Preserve the existing team, project, labels, priority and workflow conventions.
- Search Linear for duplicates before creating an issue.
- Give each issue a concise title, relevant context, acceptance criteria and implementation notes.
- Do not create or modify Linear issues unless the user explicitly asks. Do update an issue's status when your work changes it.
- If the project name is ambiguous or unavailable, ask before creating an issue.
- Planning is Notion first, then Linear issues. Read `.cursor/commands/plan.md` (`/plan` in Cursor). Do not implement unless explicitly asked.
- To review a plan or Linear issue without implementing, read `.cursor/commands/review-plan.md` (`/review-plan`).
- To implement a ticket (status, comments, PR handoff, Notion updates), read `.cursor/commands/start-issue.md` (`/start-issue`).

### Lists and pagination (`.cursor/rules/pagination.mdc`)

- Use `paginated-list` from `@/components`.
- Paginate on the server unless told otherwise, and use server-side filters when applicable.
- Use these pagination variables: `$first: Int`, `$last: Int`, `$offset: Int`, `$after: Cursor`, `$before: Cursor`.
- The default limit is 10.
- Render list items with `CardListItem` or `CollapsibleCardListItem`.

### Commit messages (`.cursor/rules/commit-message.mdc`)

Read the rule file before the first commit of a session. In short:

- Format: `<type>(<scope>): <imperative description>`, then an optional body and optional footer.
- Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `build`, `ci`, `chore`, `style`, `revert`.
- Scope is short and lowercase. Omit it when the change affects the whole project.
- Description is imperative, starts lowercase, has no trailing period, and keeps the first line to 72 characters or fewer.
- Mark a breaking change with `!` after the type or scope, or with a `BREAKING CHANGE:` footer.
- Reference a ticket in a `Refs:` footer only when the identifier is explicitly provided or reliably known.
- Before committing: review the full diff, keep the commit to one logical change, and run the relevant tests, lint, typecheck and build. Do not commit if validation fails unless explicitly authorised.
- Never include secrets, credentials or tokens.

### Forms (`.cursor/rules/forms.mdc`)

Read the rule file before creating or changing any form. In short:

- Use `useForm` from `@/lib/forms/use-form` and its registered field components.
- Validate required fields with `onChange` field validators. Use form-level validators only for cross-field rules.
- Use `form.Subscribe` and `useStore` for reactivity. Avoid `useEffect` and `useRef`.
- Do not bind `handleSubmit` to `<Form>`. Each action button is `type="button"` with an explicit `onClick` that reads `form.state.values`.
- Wrap the mutation call in `submitWrapper` from `app/actions/action.utils.ts`.
- Dynamic template-response forms follow the `useTemplateResponseForm` pattern described in the rule file.

## Rules to read before working in an area

Read the whole rule file before you touch the area it covers.

| Area | Rule file |
| -- | -- |
| Creating or updating a page (`layout.tsx`, `page.tsx`, `<module>-page.tsx`, access gating) | `.cursor/rules/page.mdc` |
| GraphQL queries or mutations (`.graphql` files, query and mutation hooks, `types.ts`, Data API grants) | `.cursor/rules/graphql.mdc` |
| SQL files and Supabase migrations (structure order, grants, RLS, pg_graphql exposure) | `.cursor/rules/migrations.mdc` |

Two migration rules apply even before you open that file: never run migration commands yourself (ask the user to run them), and ask the user to update the relevant files in `docs/` when a database change makes them stale.

## Commands

Cursor slash commands live in `.cursor/commands/`. Agents without slash commands read the matching file and follow it.

| Command | File | Use |
| -- | -- | -- |
| `/plan` | `.cursor/commands/plan.md` | Plan work in Notion, then Linear |
| `/review-plan` | `.cursor/commands/review-plan.md` | Review a plan or Linear issue without implementing |
| `/start-issue` | `.cursor/commands/start-issue.md` | Implement a Linear ticket |
| `/review` | `.cursor/commands/review.md` | Review changes |
| `/commit-message` | `.cursor/commands/commit-message.md` | Write a commit message |
