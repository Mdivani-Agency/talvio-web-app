import { describe, expect, it } from 'vitest';

import { EMPTY_RESUME_DOCUMENT } from '@lib/models/resume-document';
import { RESUME_COLORS_MAP } from '@lib/utils';

import {
  FLOW_DRAFT_ID,
  FLOW_GUEST_ID,
  FLOW_USER_ID,
  fullResumeContent,
  versionedResumeDraft,
} from '../../test/fixtures/flow';

import {
  buildResumeDocumentDraft,
  buildResumeDraft,
  DEFAULT_RESUME_TEMPLATE,
  normalizeResumeTemplate,
  parseResumeDraft,
  resumeDraftToPreview,
  resumeFlowStep,
  shouldSeedResumeFromQuery,
} from './resume-draft';
import { resumeDraftStorageKey } from './keys';

const emptyDocument = {
  resume: EMPTY_RESUME_DOCUMENT,
  name: 'my resume',
  template: 'senior-level-modern' as const,
  color: RESUME_COLORS_MAP.black,
  fontSize: 'md' as const,
};

describe('resume drafts', () => {
  it('namespaces guests and signed-in documents separately', () => {
    expect(resumeDraftStorageKey({ kind: 'user', userId: FLOW_USER_ID }, 'new')).not.toBe(
      resumeDraftStorageKey({ kind: 'user', userId: FLOW_USER_ID }, 'other-doc'),
    );
    expect(resumeDraftStorageKey({ kind: 'guest', guestId: FLOW_GUEST_ID })).toContain(
      `:guest:${FLOW_GUEST_ID}`,
    );
    expect(resumeDraftStorageKey({ kind: 'guest', guestId: FLOW_GUEST_ID }, 'new')).toBe(
      resumeDraftStorageKey({ kind: 'guest', guestId: FLOW_GUEST_ID }, 'other-doc'),
    );
  });

  it('persists appearance without a template class instance', () => {
    const draft = buildResumeDraft({
      owner: { kind: 'guest', guestId: FLOW_GUEST_ID },
      document: {
        resume: fullResumeContent,
        name: 'Ada Owner',
        label: 'Draft',
        template: 'mid-level-ember',
        color: '#1B1B1B',
        fontSize: 'sm',
      },
      step: 'resumePreview',
      documentId: 'new',
    });

    expect(draft).not.toBeNull();
    const parsed = parseResumeDraft(draft!);
    expect(parsed?.progress.step).toBe('resumePreview');
    expect(parsed?.content).toMatchObject({
      name: 'Ada Owner',
      template: 'mid-level-ember',
      color: '#1B1B1B',
      fontSize: 'sm',
    });
    expect(JSON.stringify(draft)).not.toContain('runtime-template-object');
  });

  it('only seeds while fetching and restores the editor step from the draft', () => {
    expect(shouldSeedResumeFromQuery('fetchingResume')).toBe(true);
    expect(shouldSeedResumeFromQuery('options')).toBe(false);
    expect(shouldSeedResumeFromQuery('resumePreview')).toBe(false);

    const preview = resumeDraftToPreview(versionedResumeDraft);
    expect(preview?.template).toBe('mid-level-ember');
    expect(preview?.color).toBe('#1B1B1B');
    expect(resumeFlowStep('resumePreview')).toBe('resumePreview');
    expect(resumeFlowStep('existingResume')).toBe('resumePreview');
    // MDI-675: drafts saved on the removed start and import screens open in the editor.
    expect(resumeFlowStep('importResume')).toBe('resumePreview');
    expect(resumeFlowStep('options')).toBe('resumePreview');
  });

  it('defaults a missing template so the draft can be restored', () => {
    expect(normalizeResumeTemplate(null)).toBe(DEFAULT_RESUME_TEMPLATE);
    expect(normalizeResumeTemplate('not-a-template')).toBe(DEFAULT_RESUME_TEMPLATE);

    const draft = buildResumeDraft({
      owner: { kind: 'guest', guestId: FLOW_GUEST_ID },
      document: {
        ...emptyDocument,
        template: null as unknown as typeof emptyDocument.template,
      },
      step: 'options',
      documentId: 'new',
    });

    expect(draft).not.toBeNull();
    expect(parseResumeDraft(draft!)?.content.template).toBe(DEFAULT_RESUME_TEMPLATE);
  });

  it('restores drafts saved before the optional template fields, and keeps them once filled', () => {
    const owner = { kind: 'guest' as const, guestId: FLOW_GUEST_ID };
    const before = buildResumeDraft({ owner, document: { ...emptyDocument, resume: fullResumeContent }, step: 'resumePreview', documentId: 'new' });
    expect(parseResumeDraft(before!)?.content.resume).toEqual(fullResumeContent);

    const resume = {
      ...fullResumeContent,
      profile: { ...fullResumeContent.profile, groupSkills: true },
      headlineAchievements: [{ value: '40%', label: 'faster releases' }],
      skills: [{ name: 'Go', group: 'Backend' }],
      experience: [{ ...fullResumeContent.experience![0]!, stack: ['Go', 'Kafka'] }],
    };
    const after = buildResumeDraft({ owner, document: { ...emptyDocument, resume }, step: 'resumePreview', documentId: 'new' });
    const restored = parseResumeDraft(after!)?.content.resume;
    expect(restored?.profile.groupSkills).toBe(true);
    expect(restored?.headlineAchievements).toEqual([{ value: '40%', label: 'faster releases' }]);
    expect(restored?.skills).toEqual([{ name: 'Go', group: 'Backend' }]);
    expect(restored?.experience?.[0]?.stack).toEqual(['Go', 'Kafka']);

    // A row still being typed restores too; the download is what asks for it to be finished.
    const typing = buildResumeDraft({
      owner,
      document: { ...emptyDocument, resume: { ...resume, headlineAchievements: [{ value: '40%', label: '' }] } },
      step: 'resumePreview',
      documentId: 'new',
    });
    expect(parseResumeDraft(typing!)?.content.resume.headlineAchievements).toEqual([{ value: '40%', label: '' }]);
  });

  it('builds a saved-document draft without machine context', () => {
    const draft = buildResumeDocumentDraft({
      owner: { kind: 'user', userId: FLOW_USER_ID },
      document: {
        resume: fullResumeContent,
        name: 'Ada Owner',
        label: 'Open draft',
        template: 'senior-level-talvio',
        color: '#1B1B1B',
        fontSize: 'md',
      },
      documentId: FLOW_DRAFT_ID,
    });

    expect(draft).not.toBeNull();
    expect(parseResumeDraft(draft!)?.progress.step).toBe('existingResume');
    expect(parseResumeDraft(draft!)?.content.name).toBe('Ada Owner');
    expect(buildResumeDocumentDraft({
      owner: { kind: 'guest', guestId: FLOW_GUEST_ID },
      document: emptyDocument,
      documentId: FLOW_DRAFT_ID,
    })).toBeNull();
  });

  it('rejects a step that is not part of the draft schema', () => {
    expect(buildResumeDraft({
      owner: { kind: 'user', userId: FLOW_USER_ID },
      document: emptyDocument,
      step: 'fetchingResume' as 'options',
      documentId: 'new',
    })).toBeNull();
  });
});
