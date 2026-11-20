import { describe, expect, it } from 'vitest';

import { onboardingHref, onboardingReturnPath, withOnboardingReturn } from './onboarding-return';

const params = (query: string) => new URLSearchParams(query);

describe('onboarding return path', () => {
  it('keeps the new resume and its template through onboarding', () => {
    const href = onboardingHref('/resume?template=timeline');
    expect(href).toBe('/account/create?next=%2Fresume%3Ftemplate%3Dtimeline');
    expect(onboardingReturnPath(params(href.split('?')[1]!))).toBe('/resume?template=timeline');
    expect(onboardingReturnPath(params('next=%2Fresume'))).toBe('/resume');
  });

  it.each([
    '',
    'next=',
    'next=%2Faccount',
    'next=%2Fresume%2Ftailor',
    'next=%2Fresumes',
    'next=https%3A%2F%2Fevil.example%2Fresume',
    'next=%2F%2Fevil.example%2Fresume',
  ])('has no return path for "%s"', (query) => {
    expect(onboardingReturnPath(params(query))).toBeNull();
    expect(onboardingReturnPath(null)).toBeNull();
  });

  it('carries the return path onto the next account step', () => {
    expect(withOnboardingReturn('/account/improve?saved=1', '/resume?template=timeline')).toBe(
      '/account/improve?saved=1&next=%2Fresume%3Ftemplate%3Dtimeline',
    );
    expect(withOnboardingReturn('/account/improve', '/resume')).toBe('/account/improve?next=%2Fresume');
    expect(withOnboardingReturn('/account/improve?saved=1', null)).toBe('/account/improve?saved=1');
  });
});
