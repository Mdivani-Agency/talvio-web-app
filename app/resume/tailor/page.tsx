'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { useProfile } from '@app/account/query/use-profile';
import { applyLlmProposal } from '@app/resume/query/use-apply-llm-proposal';
import { fetchResume } from '@app/resume/query/use-resume';
import { fetchAllResumes } from '@app/resume/query/use-resumes';
import { Button } from '@components/ui';
import { Loading } from '@components/views';
import { isGeneratedResume, isOpenDraft } from '@lib/adapters/resume.adapter';
import { signInHref } from '@lib/auth/sign-in-href';
import { DEFAULT_RESUME_TEMPLATE } from '@lib/drafts';
import { featureFlags } from '@lib/flags';
import { profileToResumeDocument } from '@lib/models/resume-document';
import { useUserSession } from '@lib/providers';
import { RESUME_COLORS_MAP } from '@lib/utils';

import { useTailor } from '../hooks/use-tailor';
import { TailorView, type TailorSourceOption } from '../views/tailor-view';

/*
 * Tailor a resume to a job post (MDI-221), behind NEXT_PUBLIC_FLAG_LLM_SERVICE. The source is the
 * profile or a saved general resume; the result is a new JOB_SPECIFIC resume. The service needs a
 * signed-in user, so guests are sent to sign in and come back here.
 */
function TailorPage() {
  const { session, isPending } = useUserSession();
  const userId = session?.user.id;
  const profile = useProfile(userId);
  const resumes = useQuery({
    // Under ['resumes', userId], so creating a resume refreshes it too.
    queryKey: ['resumes', userId, 'GENERAL', 'tailor-sources'],
    queryFn: () => fetchAllResumes(userId as string, 'GENERAL'),
    enabled: Boolean(userId),
  });
  const tailor = useTailor({ storageKey: userId ?? null });
  const queryClient = useQueryClient();

  const sources = useMemo<TailorSourceOption[]>(() => {
    const options: TailorSourceOption[] = [];
    const account = profile.data;
    if (account) {
      options.push({
        value: 'profile',
        label: 'My profile',
        build: async () => ({
          source: { kind: 'profile', id: account.id, revision: account.updatedAt },
          document: profileToResumeDocument(account),
          look: { template: DEFAULT_RESUME_TEMPLATE, color: RESUME_COLORS_MAP.black, fontSize: 'md' },
        }),
      });
    }
    for (const listed of resumes.data ?? []) {
      if (isOpenDraft(listed)) {
        continue;
      }
      options.push({
        value: listed.id,
        label: listed.name || 'Untitled resume',
        // The list does not carry resume content: load the resume itself when it is chosen.
        build: async () => {
          const resume = await fetchResume(listed.id);
          return {
            source: {
              kind: 'resume',
              id: resume.id,
              revision: resume.updatedAt,
              resumeType: 'general',
              state: isGeneratedResume(resume) ? 'generated' : 'draft',
              sourceResumeId: resume.sourceResumeId ?? null,
            },
            document: resume.metadata,
            look: { template: resume.template, color: resume.color, fontSize: resume.fontSize, fontFamily: resume.fontFamily },
          };
        },
      });
    }
    return options;
  }, [profile.data, resumes.data]);

  // The new resume and its AI receipt are written together; Create again returns the same resume.
  const { applyRequest } = tailor;
  const onCreate = useCallback(async () => {
    const request = applyRequest();
    if (!userId || !request) {
      throw new Error('The resume could not be created. Try again.');
    }
    const receipt = await applyLlmProposal(request);
    await queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
    return receipt.target.resumeId;
  }, [applyRequest, queryClient, userId]);

  if (isPending || (userId && (profile.isLoading || resumes.isLoading))) {
    return <Loading message="Loading your resumes..." />;
  }

  if (!userId) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pt-20">
        <h1 className="text-xl font-semibold">Tailor a resume to a job</h1>
        <p className="text-sm text-muted-foreground">Sign in to tailor a resume from your profile or a saved resume.</p>
        <div>
          <Button asChild>
            <Link href={signInHref('/resume/tailor')}>Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!sources.length && tailor.step === 'intake') {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pt-20">
        <h1 className="text-xl font-semibold">Tailor a resume to a job</h1>
        <p className="text-sm text-muted-foreground">
          {profile.isError || resumes.isError
            ? 'Your profile and resumes could not be loaded. Check your connection and reload the page.'
            : 'Fill in your profile or save a resume first, then tailor it to a job here.'}
        </p>
        <div>
          <Button asChild>
            <Link href="/resume">Create a resume</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <TailorView tailor={tailor} sources={sources} onCreate={onCreate} />;
}

export default function Page() {
  if (!featureFlags().llmService) {
    notFound();
  }
  return <TailorPage />;
}
