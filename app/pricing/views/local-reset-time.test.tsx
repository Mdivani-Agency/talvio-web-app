import { cleanup, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';

import { formatDailyResetTime } from '@/lib/pricing-page-copy';

import { LocalResetTime } from './local-reset-time';

afterEach(cleanup);

describe('LocalResetTime', () => {
  it('renders 00:00 UTC on the server, so hydration matches and visitors without JavaScript see a correct time', () => {
    expect(renderToString(<LocalResetTime />)).toContain('00:00 UTC');
  });

  it('shows the reset in local time in the browser', () => {
    render(<LocalResetTime />);
    expect(screen.getByText(`${formatDailyResetTime()} your time`)).toBeTruthy();
  });
});
