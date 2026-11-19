import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ResumeUnavailable } from './resume-unavailable';

afterEach(cleanup);

describe('ResumeUnavailable', () => {
  it('asks a guest to sign in and returns them to the same resume', () => {
    render(<ResumeUnavailable reason="signed-out" resumeId="abc-123" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Sign in to open this resume' })).toBeTruthy();
    expect(screen.getByText(/Sign in and we bring you straight back here/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe(
      '/auth/sign-in?callbackURL=%2Fresume%2Fabc-123',
    );
    expect(screen.getByRole('link', { name: 'Start a new resume' }).getAttribute('href')).toBe('/resume');
  });

  it('tells a signed-in user the resume is gone or not theirs', () => {
    render(<ResumeUnavailable reason="not-found" resumeId="abc-123" />);
    expect(screen.getByRole('heading', { level: 1, name: "We can't find this resume" })).toBeTruthy();
    expect(screen.getByText('It may have been deleted, or it belongs to another account.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Go to documents' }).getAttribute('href')).toBe('/account/documents');
    expect(screen.getByRole('link', { name: 'Start a new resume' }).getAttribute('href')).toBe('/resume');
    expect(screen.queryByRole('link', { name: 'Sign in' })).toBeNull();
  });
});
