import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { flags, improvement, access } = vi.hoisted(() => ({
  flags: { profileAiImprove: true },
  improvement: { current: { data: { available: true, used: false, usedAt: null, appliedAt: null } } as { data: unknown } },
  access: { current: { data: true } as { data: unknown } },
}));

vi.mock('@/lib/flags', async () => {
  const actual = await vi.importActual<typeof import('@/lib/flags')>('@/lib/flags');
  return { ...actual, featureFlags: () => ({ ...actual.DEFAULT_FEATURE_FLAGS, ...flags }) };
});
vi.mock('@app/account/query/use-profile-improvement', () => ({ useProfileImprovement: () => improvement.current }));
vi.mock('@app/account/hooks/use-ai-access', () => ({ useAiAccess: () => access.current }));

import { ImproveCard } from './improve-card';

const USED = { available: false, used: true, usedAt: '2026-11-19T09:00:00Z', appliedAt: null };
const UNUSED = { available: true, used: false, usedAt: null, appliedAt: null };

describe('ImproveCard', () => {
  beforeEach(() => {
    flags.profileAiImprove = true;
    improvement.current = { data: UNUSED };
    access.current = { data: true };
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('offers the improvement while it is unused', () => {
    render(<ImproveCard userId="user-1" />);
    expect(screen.getByRole('heading', { name: 'Make your profile stronger' })).toBeTruthy();
    expect(screen.getByText('Answer up to 5 questions and get suggested edits. Free, once per account.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Answer a few questions' }).getAttribute('href')).toBe('/account/improve');
  });

  it('says Continue when a run is in progress on this device', () => {
    window.localStorage.setItem('talvio-llm-improve:v1:profile:user:user-1', '{"v":1}');
    render(<ImproveCard userId="user-1" />);
    expect(screen.getByRole('link', { name: 'Continue the questions' })).toBeTruthy();
  });

  it.each([
    ['the improvement is used', () => (improvement.current = { data: USED })],
    ['the flag is still loading', () => (improvement.current = { data: undefined })],
    ['the account has no AI access', () => (access.current = { data: false })],
    ['the flag is off', () => (flags.profileAiImprove = false)],
  ])('is hidden when %s', (_label, arrange) => {
    arrange();
    const { container } = render(<ImproveCard userId="user-1" />);
    expect(container.innerHTML).toBe('');
  });
});
