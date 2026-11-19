import type { SectionCopy } from '@/lib/onboarding-copy';

/** A profile section's heading in sentence case, with its one-line hint when it has one. */
export function SectionHeading({ copy, id }: { copy: SectionCopy; id?: string }) {
  return (
    <div>
      <h2 id={id} className="text-[2rem] leading-[1.4] font-semibold text-primary">
        {copy.title}
      </h2>
      {copy.hint ? <p className="mt-1 text-sm text-muted-foreground">{copy.hint}</p> : null}
    </div>
  );
}
