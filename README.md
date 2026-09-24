# Talvio web app

Next.js 16 App Router project. Hosted on [Vercel](https://vercel.com).

## Getting started

Requires [Node.js](https://nodejs.org) 20.9 or later (22 LTS recommended) and Yarn 4.

```bash
yarn install
yarn dev
```

The app listens on [http://localhost:3002](http://localhost:3002).

```bash
yarn lint
yarn typecheck
yarn build
yarn start
```

Pull requests run lint, typecheck, tests, and `yarn build`. Pushes to `main` or `development` run those checks, then `supabase db push` and a Vercel CLI deploy. The quality job uses public `NEXT_PUBLIC_*` stubs only — no production secrets. Vercel Git auto-deploys are disabled for those two branches (`vercel.json`).

## Local Supabase

Requires the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) (CI pins 2.117.0) and Docker. Next.js stays on port 3002; the local Data API is `http://127.0.0.1:54321`.

```bash
yarn db:start    # supabase start
yarn db:reset    # drop + replay every migration + seed
yarn db:diff     # generate a migration from the shadow DB
yarn db:push     # apply pending migrations to a linked remote
```

Copy URL and keys from `supabase status` into `.env.local`. GraphQL smoke test:

```bash
curl -sS -X POST http://127.0.0.1:54321/graphql/v1 \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

See [docs/supabase-schema.md](docs/supabase-schema.md) and [docs/data-api-grants.md](docs/data-api-grants.md).

## Environment variables

Copy [`.env.example`](.env.example) to `.env.local`. Set the same names in the Vercel project (Development / Preview / Production).

| Name | Required | Used for |
| --- | --- | --- |
| `NEXT_PUBLIC_BASE_URL` | yes | Public site origin (auth redirect and error URLs) |
| `NEXT_PUBLIC_API_BASE_URL` | yes | Media-service origin (`/media`). Account and resume data go through Supabase GraphQL. |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL (`http://127.0.0.1:54321` locally) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | Supabase publishable / anon key |
| `SUPABASE_SECRET_KEY` | yes (server) | Supabase secret / service-role key — never `NEXT_PUBLIC_` |
| `MEDIA_SERVICE_API_KEY` | yes (server) | Media-service `X-API-KEY` for `POST /media/presign/{userId}` — never `NEXT_PUBLIC_` |
| `GOOGLE_FONTS_API_KEY` | yes | Font file lookup at `/api/resume/fonts` |
| `OPENAI_API_KEY` | no | Resume parse/QA; falls back to `TEST_KEY` if unset |

## GitHub Actions

Vercel deploy uses **repository** credentials (same values for `main` and `development`):

| Name | Store as | Used for |
| --- | --- | --- |
| `VERCEL_TOKEN` | repository secret | Vercel CLI deploy |
| `VERCEL_ORG_ID` | repository secret or variable | Vercel team / org |
| `VERCEL_PROJECT_ID` | repository secret or variable | Vercel project |

Supabase `db push` still reads GitHub Environment secrets when the hosted project differs per branch:

| Environment | Branch | Hosted Supabase |
| --- | --- | --- |
| `development` | `development` | talvio-dev |
| `production` | `main` | talvio-prod |

| Secret | Used for |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI `db push` |
| `SUPABASE_PROJECT_REF` | Target project ref for that environment |

`db push` fails until both Supabase environment secrets are set. Deploy fails until `VERCEL_TOKEN` is a repository secret and the Vercel org/project IDs are repository secrets or variables.

## Deploy on Vercel

Keep the repo connected to the Vercel project (Next.js framework preset) so CLI deploys can pull env vars. Do **not** rely on Vercel Git auto-deploys for `main` or `development` — `vercel.json` turns those off. GitHub Actions deploys `main` as production and `development` as preview.

| Setting | Value |
| --- | --- |
| Framework | Next.js |
| Node.js | 20.9 or later (22.x recommended) |
| Install | `yarn install` |
| Build | `yarn build` |
| Output | `.next` (handled by the Next.js preset) |

Add the environment variables above to the Vercel project. Preview and production should each use the matching public URLs for `NEXT_PUBLIC_BASE_URL`, the API origin, and the hosted Supabase project (`talvio-dev` / `talvio-prod`). Redirect URLs must include `/auth/callback`.

Do not use AWS Amplify for this app. Amplify Hosting config has been removed.
