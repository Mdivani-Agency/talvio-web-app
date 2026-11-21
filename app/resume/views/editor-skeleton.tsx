import { Logo } from '@components/ui';
import { SkeletonBlock, SkeletonShapes, SkeletonStatus } from '@components/views';
import { RESUME_LOADING_LABEL } from '@/lib/resume-editor-copy';

const SECTIONS = 6;

/**
 * The resume editor while it loads (MDI-671): its top bar, then the section list beside the preview with an A4 page,
 * in grey. Below `md` the editor shows one panel, so the skeleton shows the section list only. Nothing is locked.
 */
export function EditorSkeleton() {
  return (
    <section className="flex h-dvh min-h-0 min-w-0 flex-col overflow-hidden bg-background">
      <header className="flex h-[5.6rem] flex-none items-center gap-3 border-b border-border px-4 md:h-[6.4rem] md:px-6">
        <Logo size="small" />
        <SkeletonStatus label={RESUME_LOADING_LABEL} className="ml-2" />
      </header>
      <SkeletonShapes className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,40rem)_minmax(0,1fr)] lg:grid-cols-[clamp(51.2rem,42vw,88rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-2 p-4 md:border-r md:border-border md:p-6">
          {Array.from({ length: SECTIONS }, (_, index) => (
            <SkeletonBlock key={index} tone="card" className="h-[5.6rem] rounded-[1rem]" />
          ))}
        </div>
        <div className="hidden min-h-0 justify-center bg-accent px-10 py-6 md:flex">
          <SkeletonBlock className="aspect-[210/297] h-full max-h-[84rem] rounded-[0.4rem]" />
        </div>
      </SkeletonShapes>
    </section>
  );
}
