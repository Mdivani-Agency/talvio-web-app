import { PageContainer, SkeletonBlock, SkeletonShapes, SkeletonStatus } from '@components/views';
import { ACCOUNT_LOADING_LABEL, PROFILE_FORM_LOADING_LABEL } from '@/lib/account-copy';

/**
 * The account page while it loads (MDI-671): the heading, the profile improvement card, My resumes beside the
 * allowance, and the profile, in grey. Nothing is locked; the sidebar keeps working.
 */
export function AccountSkeleton() {
  return (
    <PageContainer as="section" className="flex flex-col gap-8 py-6 md:py-10">
      <SkeletonStatus label={ACCOUNT_LOADING_LABEL} />
      <SkeletonShapes className="flex flex-col gap-8">
        <div className="flex flex-col gap-2.5">
          <SkeletonBlock className="h-[3.2rem] w-[26rem] max-w-full" />
          <SkeletonBlock className="h-[1.6rem] w-[42rem] max-w-full" />
        </div>
        <SkeletonBlock tone="card" className="h-[11.2rem]" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <SkeletonBlock tone="card" className="h-[26rem]" />
          <SkeletonBlock tone="card" className="h-[18rem]" />
        </div>
        <SkeletonBlock className="h-[2.2rem] w-[18rem]" />
        <SkeletonBlock tone="card" className="h-[16rem]" />
      </SkeletonShapes>
    </PageContainer>
  );
}

/** The profile form while it loads: the heading and intro, the form's sections and, from `lg`, the side card. */
export function AccountFormSkeleton() {
  return (
    <PageContainer as="section" className="flex flex-col gap-6 pt-8 pb-10 lg:pt-10">
      <SkeletonStatus label={PROFILE_FORM_LOADING_LABEL} />
      <SkeletonShapes className="flex flex-col gap-6">
        <div className="flex flex-col gap-2.5">
          <SkeletonBlock className="h-[3.2rem] w-[30rem] max-w-full" />
          <SkeletonBlock className="h-[1.6rem] w-[52rem] max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_30rem] lg:items-start">
          <div className="flex flex-col gap-6">
            <SkeletonBlock tone="card" className="h-[32rem]" />
            <SkeletonBlock tone="card" className="h-[20rem]" />
          </div>
          <SkeletonBlock tone="card" className="hidden h-[24rem] lg:block" />
        </div>
      </SkeletonShapes>
    </PageContainer>
  );
}

/**
 * The whole account shell while the session is restored, before the sidebar can show the person: a grey sidebar from
 * `md` beside the account page skeleton.
 */
export function AccountShellSkeleton() {
  return (
    <div className="flex min-h-screen min-w-0 flex-col md:flex-row">
      <SkeletonShapes className="hidden h-screen w-[25.6rem] shrink-0 flex-col gap-6 border-r border-input px-4 py-5 md:flex">
        <SkeletonBlock className="h-[3.2rem] w-[14rem]" />
        <SkeletonBlock className="h-[4.4rem]" />
        <div className="flex flex-col gap-2">
          <SkeletonBlock className="h-[4rem]" />
          <SkeletonBlock className="h-[4rem]" />
          <SkeletonBlock className="h-[4rem]" />
        </div>
      </SkeletonShapes>
      <div className="w-full min-w-0">
        <AccountSkeleton />
      </div>
    </div>
  );
}
