import { describe, expect, it } from 'vitest';
import { createActor } from 'xstate';

import { resumeState } from '@app/resume/state/machine';

import {
  FLOW_DRAFT_ID,
  FLOW_GUEST_ID,
  FLOW_USER_ID,
  fullResumeContent,
  versionedResumeDraft,
} from '../../test/fixtures/flow';
import type { ResumeContext } from '@app/resume/state/types';
import { EMPTY_RESUME_DOCUMENT } from '@lib/models/resume-document';
import { RESUME_COLORS_MAP } from '@lib/utils';

import {
  buildResumeDocumentDraft,
  buildResumeDraft,
  DEFAULT_RESUME_TEMPLATE,
  normalizeResumeTemplate,
  parseResumeDraft,
  resumeDraftRestoreEvents,
  resumeDraftToPreview,
  shouldSeedResumeFromQuery,
} from './resume-draft';
import { resumeDraftStorageKey } from './keys';

const emptyContext: ResumeContext = {
  resumeId: null,
  resumeDto: {
    resume: EMPTY_RESUME_DOCUMENT,
    name: 'my resume',
    template: 'senior-level-modern',
    color: RESUME_COLORS_MAP.black,
    fontSize: 'md',
  },
  template: null,
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
      context: {
        ...emptyContext,
        resumeDto: {
          resume: fullResumeContent,
          name: 'Ada Owner',
          label: 'Draft',
          template: 'mid-level-ember',
          color: '#1B1B1B',
          fontSize: 'sm',
        },
      },
      stateValue: { newResume: 'resumePreview' },
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

  it('only seeds the query while fetching and restores via events', () => {
    expect(shouldSeedResumeFromQuery('fetchingResume')).toBe(true);
    expect(shouldSeedResumeFromQuery('options')).toBe(false);
    expect(shouldSeedResumeFromQuery({ newResume: 'resumePreview' })).toBe(false);

    const events = resumeDraftRestoreEvents(versionedResumeDraft);
    expect(events[0]).toEqual({
      type: 'FETCHING_RESUME_FAILURE',
      value: resumeDraftToPreview(versionedResumeDraft),
    });
    expect(events[1]).toEqual({ type: 'SELECT_MANUAL_INPUT' });

    const actor = createActor(resumeState);
    actor.start();
    for (const event of events) {
      actor.send(event);
    }
    const snapshot = actor.getSnapshot();
    expect(snapshot.matches({ newResume: 'resumePreview' })).toBe(true);
    expect(snapshot.context.resumeDto.template).toBe('mid-level-ember');
    expect(snapshot.context.resumeDto.color).toBe('#1B1B1B');
    expect(snapshot.context.template).toBeNull();
    actor.stop();
  });

  it('defaults a missing template so the draft can be restored', () => {
    expect(normalizeResumeTemplate(null)).toBe(DEFAULT_RESUME_TEMPLATE);
    expect(normalizeResumeTemplate('not-a-template')).toBe(DEFAULT_RESUME_TEMPLATE);

    const draft = buildResumeDraft({
      owner: { kind: 'guest', guestId: FLOW_GUEST_ID },
      context: {
        ...emptyContext,
        resumeDto: {
          ...emptyContext.resumeDto,
          template: null as unknown as ResumeContext['resumeDto']['template'],
        },
      },
      stateValue: 'options',
      documentId: 'new',
    });

    expect(draft).not.toBeNull();
    expect(parseResumeDraft(draft!)?.content.template).toBe(DEFAULT_RESUME_TEMPLATE);
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
      document: emptyContext.resumeDto,
      documentId: FLOW_DRAFT_ID,
    })).toBeNull();
  });

  it('does not persist the fetching state', () => {
    expect(buildResumeDraft({
      owner: { kind: 'user', userId: FLOW_USER_ID },
      context: emptyContext,
      stateValue: 'fetchingResume',
      documentId: 'new',
    })).toBeNull();
  });
});
