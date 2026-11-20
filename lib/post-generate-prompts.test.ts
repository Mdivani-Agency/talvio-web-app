import { describe, expect, it } from 'vitest';

import {
  choosePostGeneratePrompt,
  dismissTrackerPrompt,
  rememberTailoredJob,
  tailoredJobFor,
  trackerPromptDismissed,
  trackerResumeIds,
} from './post-generate-prompts';

function memoryStore() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) };
}

describe('post-generate prompts', () => {
  it('shows the tracker bar over the review prompt, and the review prompt only when the bar is not due', () => {
    expect(choosePostGeneratePrompt({ trackerDue: true, feedbackDue: true })).toBe('tracker');
    expect(choosePostGeneratePrompt({ trackerDue: true, feedbackDue: false })).toBe('tracker');
    expect(choosePostGeneratePrompt({ trackerDue: false, feedbackDue: true })).toBe('feedback');
    expect(choosePostGeneratePrompt({ trackerDue: false, feedbackDue: false })).toBeNull();
  });

  it('counts a draft family: the resume and its generated original', () => {
    expect(trackerResumeIds({ id: 'r1' })).toEqual(['r1']);
    expect(trackerResumeIds({ id: 'draft', sourceResumeId: 'original' })).toEqual(['draft', 'original']);
  });

  it('remembers a dismissal per resume and per user on this device', () => {
    const store = memoryStore();
    expect(trackerPromptDismissed('u1', ['r1'], store)).toBe(false);
    dismissTrackerPrompt('u1', 'r1', store);
    expect(trackerPromptDismissed('u1', ['r1'], store)).toBe(true);
    expect(trackerPromptDismissed('u1', ['draft', 'r1'], store)).toBe(true);
    expect(trackerPromptDismissed('u2', ['r1'], store)).toBe(false);
  });

  it('keeps the tailored job with its resume and finds it for the family', () => {
    const store = memoryStore();
    rememberTailoredJob('u1', 'r1', { position: ' Staff Engineer ', company: 'Fjord', url: undefined }, store);
    expect(tailoredJobFor('u1', ['draft', 'r1'], store)).toEqual({ position: 'Staff Engineer', company: 'Fjord', url: '' });
    expect(tailoredJobFor('u1', ['other'], store)).toBeNull();
  });

  it('treats unreadable storage as empty', () => {
    const broken = { getItem: () => '{not json', setItem: () => undefined };
    expect(trackerPromptDismissed('u1', ['r1'], broken)).toBe(false);
    expect(tailoredJobFor('u1', ['r1'], broken)).toBeNull();
  });
});
