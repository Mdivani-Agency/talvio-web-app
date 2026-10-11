import { describe, expect, it } from 'vitest';

import {
  agencyOnlyPost,
  eligibleFixturePosts,
  FIXTURE_NOW,
  futureTalvioPost,
  ineligibleFixturePosts,
  sharedAgencyTaggedPost,
  sharedPost,
  sharedTalvioTaggedPost,
  talvioDraftPost,
  talvioPublishedPost,
  unpublishedTalvioPost,
} from '@/test/fixtures/blog';

import { isAgencyPrimary, isEligibleForTalvio } from './eligibility';

const now = new Date(FIXTURE_NOW);

describe('isEligibleForTalvio', () => {
  it.each(eligibleFixturePosts.map((post) => [post.slug, post]))('accepts %s', (_slug, post) => {
    expect(isEligibleForTalvio(post, now)).toBe(true);
  });

  it.each(ineligibleFixturePosts.map((post) => [post.slug, post]))('rejects %s', (_slug, post) => {
    expect(isEligibleForTalvio(post, now)).toBe(false);
  });

  it('rejects drafts, including one that keeps an earlier publication date', () => {
    expect(isEligibleForTalvio(talvioDraftPost, now)).toBe(false);
    expect(isEligibleForTalvio(unpublishedTalvioPost, now)).toBe(false);
  });

  it('rejects posts that do not list Talvio', () => {
    expect(isEligibleForTalvio(agencyOnlyPost, now)).toBe(false);
  });

  it('accepts a post published exactly now and rejects one published later', () => {
    expect(isEligibleForTalvio({ ...talvioPublishedPost, published_at: FIXTURE_NOW }, now)).toBe(true);
    expect(isEligibleForTalvio(futureTalvioPost, now)).toBe(false);
  });

  it('rejects a published post without a valid date instead of inventing one', () => {
    expect(isEligibleForTalvio({ ...talvioPublishedPost, published_at: null }, now)).toBe(false);
    expect(isEligibleForTalvio({ ...talvioPublishedPost, published_at: 'not a date' }, now)).toBe(false);
  });

  it('applies the tag backstop the same way as the backend', () => {
    expect(isEligibleForTalvio(sharedAgencyTaggedPost, now)).toBe(false);
    for (const tag of ['agency', 'Agency', 'AGENCY']) {
      expect(isEligibleForTalvio({ ...sharedPost, tags: [tag] }, now)).toBe(false);
    }
    expect(isEligibleForTalvio({ ...sharedPost, tags: ['agency', 'talvio'] }, now)).toBe(true);
    expect(isEligibleForTalvio({ ...sharedPost, tags: ['agency-story'] }, now)).toBe(true);
    expect(isEligibleForTalvio({ ...sharedPost, tags: ['aGeNcY'] }, now)).toBe(true);
  });
});

describe('isAgencyPrimary', () => {
  it('marks a post both sites show as the agency’s', () => {
    expect(isAgencyPrimary(sharedPost)).toBe(true);
  });

  it('leaves Talvio-only posts and shared posts tagged for Talvio with Talvio', () => {
    expect(isAgencyPrimary(talvioPublishedPost)).toBe(false);
    expect(isAgencyPrimary(sharedTalvioTaggedPost)).toBe(false);
  });

  it('treats a post tagged for both sites as shown on both', () => {
    expect(isAgencyPrimary({ sites: ['agency', 'talvio'], tags: ['talvio', 'Agency'] })).toBe(true);
  });
});
