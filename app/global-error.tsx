'use client';

import * as Sentry from '@sentry/nextjs';
import { TriangleAlert } from 'lucide-react';
import { useEffect } from 'react';

import { Icon } from '@components/icons';
import {
  GLOBAL_ERROR_BODY,
  GLOBAL_ERROR_RELOAD_LABEL,
  GLOBAL_ERROR_TITLE,
  SUPPORT_EMAIL,
  SUPPORT_HELP_PREFIX,
} from '@/lib/status-copy';

/*
 * This page replaces the root layout, so neither globals.css nor the theme class reaches it. The small style block
 * below carries the design tokens it needs and follows the system light or dark setting.
 */
const STYLES = `
.tg{--bg:#fefefe;--fg:#0d0d0d;--muted:#696a6e;--brand:#1e20d4;--on-brand:#fefefe;--tile:#ffe8e8;--danger:#ff1f1f;
  margin:0;min-height:100vh;display:flex;flex-direction:column;background:var(--bg);color:var(--fg);
  font-family:system-ui,-apple-system,'Segoe UI',Roboto,Montserrat,sans-serif;font-size:16px;line-height:1.5;
  -webkit-font-smoothing:antialiased}
@media (prefers-color-scheme:dark){.tg{--bg:#0d0d0d;--fg:#fefefe;--muted:#f6f6fe;--brand:#7375e5;--on-brand:#0d0d0d;--tile:#3a1a1a}}
.tg-bar{padding:40px 16px 0;display:flex}
.tg-logo{display:flex;align-items:center;gap:4px;color:inherit;text-decoration:none;font-weight:600;text-transform:uppercase}
.tg-logo b{color:var(--brand);font-weight:600}
.tg-main{flex:1;display:flex;align-items:center;justify-content:center;padding:48px 16px 64px;box-sizing:border-box}
.tg-box{width:100%;max-width:560px;display:flex;flex-direction:column;align-items:flex-start;gap:20px}
.tg-tile{width:72px;height:72px;border-radius:20px;background:var(--tile);color:var(--danger);display:flex;align-items:center;justify-content:center}
.tg h1{margin:0;font-size:26px;line-height:1.25;font-weight:600}
.tg-body{margin:0;font-size:16px;line-height:1.556;color:var(--muted)}
.tg-button{margin-top:8px;align-self:stretch;height:48px;padding:0 24px;border:0;border-radius:8px;background:var(--brand);
  color:var(--on-brand);font-family:inherit;font-size:16px;font-weight:600;cursor:pointer}
.tg-button:focus-visible{outline:3px solid var(--brand);outline-offset:2px}
.tg-help{margin:4px 0 0;font-size:14px;color:var(--muted)}
.tg-help a{color:var(--fg)}
@media (min-width:768px){
  .tg-bar{padding:40px 24px 0;justify-content:center}
  .tg-main{padding:64px 40px 96px}
  .tg-box{align-items:center;text-align:center}
  .tg h1{font-size:36px}
  .tg-body{font-size:18px}
  .tg-button{align-self:center}
}
`;

/** Shown when the root layout itself fails. Sentry still receives the error. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>{GLOBAL_ERROR_TITLE}</title>
        <style>{STYLES}</style>
      </head>
      <body className="tg">
        <div className="tg-bar">
          {/* A full page load, not the client router: the app shell is what failed. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="tg-logo" aria-label="Talvio home">
            <Icon type="Logo" width={40} height={32} />
            <span aria-hidden="true">
              <b>Tal</b>vio
            </span>
          </a>
        </div>
        <main className="tg-main">
          <div className="tg-box">
            <span className="tg-tile" aria-hidden="true">
              <TriangleAlert size={32} strokeWidth={1.75} />
            </span>
            <h1>{GLOBAL_ERROR_TITLE}</h1>
            <p className="tg-body">{GLOBAL_ERROR_BODY}</p>
            <button type="button" className="tg-button" onClick={() => window.location.reload()}>
              {GLOBAL_ERROR_RELOAD_LABEL}
            </button>
            <p className="tg-help">
              {SUPPORT_HELP_PREFIX} <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
