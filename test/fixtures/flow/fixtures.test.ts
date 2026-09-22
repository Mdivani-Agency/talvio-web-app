import { describe, expect, it } from 'vitest';

import { ACCOUNT_SNAPSHOT_KEY } from '@app/account/state/storage';
import { RESUME_SNAPSHOT_KEY } from '@app/resume/state/storage';
import {
  isGeneratedResume,
  isOpenDraft,
  parseResumeContent,
  toResume,
} from '@/lib/adapters/resume.adapter';
import {
  accountDtoToSavePayload,
  employmentToApp,
  employmentToDb,
  toDateOnly,
  toIsoDateTime,
} from '@/lib/adapters/profile.adapter';
import { accountSchema } from '@lib/schema/account.schema';
import { resumeFormSchema, resumeSchema } from '@lib/schema/resume.schema';
import { profileToResumeDocument } from '@lib/models/resume-document';

import {
  EDUCATION_ID,
  EXPERIENCE_ID,
  fullAccountDto,
  fullResumeContent,
  generatedResumeRow,
  LANGUAGE_ID,
  legacyAccountSnapshot,
  legacyResumeSnapshot,
  LEGACY_ACCOUNT_SNAPSHOT_PREFIX,
  LEGACY_RESUME_SNAPSHOT_KEY,
  LINK_ID,
  openDraftRow,
  persistedExperienceDates,
  PROJECT_ID,
  RECOMMENDATION_ID,
  savedAccount,
  SKILL_ID,
  standaloneDraftRow,
  TOOL_ID,
} from './index';

describe('flow baseline fixtures', () => {
  it('parses the full profile draft and the saved account', () => {
    const draft = accountSchema.safeParse(fullAccountDto);
    const saved = accountSchema.safeParse(savedAccount);
    expect(draft.success).toBe(true);
    expect(saved.success).toBe(true);
    if (!draft.success || !saved.success) {
      return;
    }

    expect(draft.data.experience?.[0]?.id).toBe(EXPERIENCE_ID);
    expect(draft.data.education?.[0]?.id).toBe(EDUCATION_ID);
    expect(draft.data.projects?.[0]?.id).toBe(PROJECT_ID);
    expect(draft.data.recommendations?.[0]?.id).toBe(RECOMMENDATION_ID);
    expect(draft.data.links?.[0]?.id).toBe(LINK_ID);
    expect(draft.data.skills?.[0]?.id).toBe(SKILL_ID);
    expect(draft.data.tools?.[0]?.id).toBe(TOOL_ID);
    expect(draft.data.languages?.[0]?.id).toBe(LANGUAGE_ID);
    expect(saved.data.experience?.[0]?.id).toBe(EXPERIENCE_ID);

    const payload = accountDtoToSavePayload(draft.data);
    expect(payload).not.toHaveProperty('contacts');
    expect(payload.profile).toMatchObject({
      email: fullAccountDto.profile.email,
      phone: fullAccountDto.profile.phone,
      website: fullAccountDto.profile.website,
    });
    expect(payload.experience[0]?.id).toBe(EXPERIENCE_ID);
    expect(payload.education[0]?.id).toBe(EDUCATION_ID);
    expect(payload.projects[0]?.id).toBe(PROJECT_ID);
    expect(payload.recommendations[0]?.id).toBe(RECOMMENDATION_ID);
    expect(payload.links[0]?.id).toBe(LINK_ID);
    expect(payload.skills[0]?.id).toBe(SKILL_ID);
    expect(payload.tools[0]?.id).toBe(TOOL_ID);
    expect(payload.languages[0]?.id).toBe(LANGUAGE_ID);
  });

  it('parses resume content, including rich text and enums', () => {
    const parsed = resumeFormSchema.safeParse(fullResumeContent);
    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }
    expect(parsed.data.experience?.[0]?.description?.type).toBe('doc');
    expect(parsed.data.projects?.[0]?.description?.type).toBe('doc');
    expect(parsed.data.experience?.[0]?.employmentType).toBe('contract');
    expect(parsed.data.education?.[0]?.degreeType).toBe('MBA');
    expect(parsed.data.languages?.[0]?.proficiency).toBe('native');
  });

  it('round-trips date-only persistence and employment enums', () => {
    expect(toDateOnly(fullAccountDto.experience?.[0]?.startDate)).toBe(
      persistedExperienceDates.startDate,
    );
    expect(toIsoDateTime(persistedExperienceDates.endDate)).toBe(
      '2024-06-01T00:00:00.000Z',
    );
    expect(employmentToDb('part-time')).toBe('part_time');
    expect(employmentToApp('self_employed')).toBe('self-employed');
    expect(employmentToApp('office')).toBeUndefined();
  });

  it('maps saved, generated, and open-draft rows', () => {
    const standalone = toResume(standaloneDraftRow);
    const generated = toResume(generatedResumeRow);
    const draft = toResume(openDraftRow);

    expect(parseResumeContent(standaloneDraftRow.content)?.profile.firstName).toBe('Ada');
    expect(isGeneratedResume(standalone)).toBe(false);
    expect(isOpenDraft(standalone)).toBe(false);
    expect(isGeneratedResume(generated)).toBe(true);
    expect(generated.media).toEqual({
      url: 'https://media.example/ada-v1.pdf',
      key: 'users/ada/ada-v1.pdf',
    });
    expect(isOpenDraft(draft)).toBe(true);
    expect(draft.sourceResumeId).toBe(generated.id);

    const asResume = resumeSchema.safeParse({
      metadata: fullResumeContent,
      name: generated.name,
      label: generated.label,
      template: generated.template,
      color: generated.color,
      fontSize: generated.fontSize,
      fontFamily: generated.fontFamily,
    });
    expect(asResume.success).toBe(true);
  });

  it('keeps legacy snapshot content and matches the live storage keys', () => {
    expect(LEGACY_ACCOUNT_SNAPSHOT_PREFIX).toBe(ACCOUNT_SNAPSHOT_KEY);
    expect(LEGACY_RESUME_SNAPSHOT_KEY).toBe(`${RESUME_SNAPSHOT_KEY}-new_resume`);
    expect(accountSchema.safeParse(legacyAccountSnapshot.context.accountDto).success).toBe(true);
    expect(legacyAccountSnapshot.context.questions).toHaveLength(2);
    expect(legacyAccountSnapshot.context.answers).toEqual(['Preview pipeline', 'Skipped']);
    expect(legacyAccountSnapshot.context.questions[0]).not.toHaveProperty('id');
    expect(legacyResumeSnapshot.context.resumeDto.template).toBe('mid-level-ember');
    expect(legacyResumeSnapshot.context.template).toEqual({ kind: 'runtime-template-object' });
  });

  it('converts a profile once and keeps every previously dropped field', () => {
    const converted = profileToResumeDocument(fullAccountDto);
    expect(converted.profile).toEqual({
      firstName: 'Ada',
      lastName: 'Owner',
      role: 'Staff Engineer',
      tagline: 'Builds hiring products',
    });
    expect(converted.contacts).toEqual({
      email: 'ada@talvio.test',
      phone: '+1-415-555-0100',
      url: 'https://ada.example',
    });
    expect(converted.location).toEqual({ city: 'Oakland', country: 'United States' });
    expect(converted.skills).toEqual([{ id: SKILL_ID, name: 'TypeScript' }]);
    expect(converted.tools).toEqual([{ id: TOOL_ID, name: 'Postgres' }]);
    expect(converted.links).toEqual([{ id: LINK_ID, type: 'github', value: 'https://github.com/ada' }]);
    expect(converted.languages).toEqual([{ id: LANGUAGE_ID, language: 'English', proficiency: 'native' }]);
    expect(converted.experience?.[0]).toMatchObject({
      id: EXPERIENCE_ID,
      company: 'Talvio',
      jobTitle: 'Staff Engineer',
      employmentType: 'full-time',
      locationType: 'hybrid',
      isPresent: false,
      achievements: ['Cut PDF render time'],
      responsibilities: ['Owned the editor'],
      keyContributions: ['Shipped template gallery'],
    });
    expect(converted.experience?.[0]?.description?.content?.[0]?.content?.[0]?.content?.[0]).toMatchObject({
      type: 'paragraph',
      marks: [{ type: 'keyContributions' }],
    });
    expect(converted.education?.[0]?.id).toBe(EDUCATION_ID);
    expect(converted.education?.[0]?.description).toMatchObject({ type: 'doc' });
    expect(converted.recommendations?.[0]?.id).toBe(RECOMMENDATION_ID);
    expect(converted.recommendations?.[0]?.description).toMatchObject({ type: 'doc' });
    expect(converted.projects?.[0]?.id).toBe(PROJECT_ID);
    expect(converted.projects?.[0]?.description).toMatchObject({ type: 'doc' });

    const reloaded = parseResumeContent(JSON.stringify(fullResumeContent));
    expect(reloaded?.experience?.[0]?.description).toEqual(fullResumeContent.experience?.[0]?.description);
    expect(reloaded?.education?.[0]?.description).toEqual(fullResumeContent.education?.[0]?.description);
    expect(reloaded?.recommendations?.[0]?.description).toEqual(fullResumeContent.recommendations?.[0]?.description);
    expect(reloaded?.projects?.[0]?.description).toEqual(fullResumeContent.projects?.[0]?.description);
    expect(reloaded?.experience?.[0]?.id).toBe(EXPERIENCE_ID);
    expect(reloaded?.skills?.[0]?.id).toBe(SKILL_ID);
  });
});
