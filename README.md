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

Pull requests and pushes to `main` / `development` run the same lint, typecheck, and `yarn build` steps in GitHub Actions. The workflow uses Node 22 and Yarn 4 via Corepack, with public `NEXT_PUBLIC_*` stubs only — no production secrets.

## Environment variables

Set these locally (`.env.local`) and in the Vercel project settings.

| Name | Required | Used for |
| --- | --- | --- |
| `NEXT_PUBLIC_BASE_URL` | yes | Public site origin (auth redirect and error URLs) |
| `NEXT_PUBLIC_API_BASE_URL` | yes | Resume, account, and media API origin |
| `NEXT_PUBLIC_AUTH_BASE_URL` | yes | better-auth client base URL |
| `GOOGLE_FONTS_API_KEY` | yes | Font file lookup at `/api/resume/fonts` |
| `OPENAI_API_KEY` | no | Resume parse/QA; falls back to `TEST_KEY` if unset |

## Deploy on Vercel

Connect this repo to a Vercel project (Next.js framework preset). Vercel does not need a `vercel.json` — the Next.js preset is enough.

| Setting | Value |
| --- | --- |
| Framework | Next.js |
| Node.js | 20.9 or later (22.x recommended) |
| Install | `yarn install` |
| Build | `yarn build` |
| Output | `.next` (handled by the Next.js preset) |

Add the environment variables above to the Vercel project. Preview and production should each use the matching public URLs for `NEXT_PUBLIC_BASE_URL` and the API/auth origins.

Do not use AWS Amplify for this app. Amplify Hosting config has been removed.
