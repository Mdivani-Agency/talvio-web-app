import { describe, expect, it } from 'vitest';

import {
  groupResumeFamilies,
  isGeneratedResume,
  isOpenDraft,
  toResume,
} from '@/lib/adapters/resume.adapter';
import { isLabelOnlyPatch } from '@app/resume/query/use-save-resume-edit';
import { accountSignInRedirect, signInHref } from '@lib/auth/sign-in-href';
import {
  adoptDraft,
  resumeDraftStorageKey,
  shouldSeedResumeFromQuery,
} from '@lib/drafts';
import { profileToResumeDocument } from '@lib/models/resume-document';

import {
  FLOW_GUEST_ID,
  FLOW_USER_ID,
  fullAccountDto,
  generatedResumeRow,
  openDraftRow,
  standaloneDraftRow,
  versionedResumeDraft,
} from './index';

describe('cross-flow journeys', () => {
  it('keeps a guest resume on its own key until the signed-in user adopts it', () => {
    const guestKey = resumeDraftStorageKey({ kind: 'guest', guestId: FLOW_GUEST_ID });
    const userKey = resumeDraftStorageKey({ kind: 'user', userId: FLOW_USER_ID }, 'new');
    const adopted = adoptDraft(versionedResumeDraft, { kind: 'user', userId: FLOW_USER_ID });

    expect(guestKey).not.toBe(userKey);
    expect(versionedResumeDraft.owner).toEqual({ kind: 'guest', guestId: FLOW_GUEST_ID });
    expect(adopted.owner).toEqual({ kind: 'user', userId: FLOW_USER_ID });
    expect(adopted.draftId).toBe(versionedResumeDraft.draftId);
    expect(adopted.content).toEqual(versionedResumeDraft.content);
    expect(versionedResumeDraft.owner).toEqual({ kind: 'guest', guestId: FLOW_GUEST_ID });
  });

  it('copies a profile into a resume without mutating the account or dropping rich text', () => {
    const before = structuredClone(fullAccountDto);
    const document = profileToResumeDocument(fullAccountDto);

    expect(fullAccountDto).toEqual(before);
    expect(document.experience?.[0]?.description).toMatchObject({ type: 'doc' });
    expect(document.education?.[0]?.description).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Computer science' }] }],
    });
    document.profile.firstName = 'Changed';
    expect(fullAccountDto.profile.firstName).toBe('Ada');
    expect(shouldSeedResumeFromQuery('fetchingResume')).toBe(true);
    expect(shouldSeedResumeFromQuery('resumePreview')).toBe(false);
  });

  it('reuses one open draft and leaves a label edit on the generated row', () => {
    const generated = toResume(generatedResumeRow);
    const draft = toResume(openDraftRow);
    const standalone = toResume(standaloneDraftRow);

    expect(isGeneratedResume(generated)).toBe(true);
    expect(isOpenDraft(draft)).toBe(true);
    expect(groupResumeFamilies([generated, draft, standalone])).toEqual([
      { id: generated.id, original: generated, draft },
      { id: standalone.id, draft: standalone },
    ]);
    expect(isLabelOnlyPatch({ label: 'Shipped v2' })).toBe(true);
    expect(isLabelOnlyPatch({ label: 'Shipped v2', color: generated.color })).toBe(false);
    expect(generated.media?.url).toBe(generatedResumeRow.pdf_url);
  });

  it('sends resume download and documents back through a local callback', () => {
    expect(signInHref('/resume?template=mid-level-ember')).toBe(
      '/auth/sign-in?callbackURL=%2Fresume%3Ftemplate%3Dmid-level-ember',
    );
    expect(accountSignInRedirect('/account/documents')).toBe(
      '/auth/sign-in?callbackURL=%2Faccount%2Fdocuments',
    );
  });
});
