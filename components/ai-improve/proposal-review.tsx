import { Badge, Button, Card, CardContent, CardFooter, Checkbox } from '@components/ui';
import type { AiFieldChange, AiItemSection, AiProposalResult } from '@lib/ai-improve/payload';

const SECTION_LABEL: Record<AiFieldChange['section'], string> = {
  profile: 'Profile',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  recommendations: 'Recommendations',
  skills: 'Skills',
  tools: 'Tools',
  languages: 'Languages',
  links: 'Links',
};

const FIELD_LABEL: Record<string, string> = {
  tagline: 'Summary',
  additionalDetails: 'Details',
  achievements: 'Achievements',
  responsibilities: 'Responsibilities',
  keyContributions: 'Key contributions',
  role: 'Role',
  add: 'Add',
};

type ProposalReviewProps = {
  review: AiProposalResult;
  writingVoiceVersion?: number | null;
  onAccept: () => void;
  onReject: () => void;
  /** Change ids the user confirmed (LLM service proposals). */
  confirmed?: ReadonlySet<string>;
  onToggleConfirmed?: (changeId: string) => void;
  /** Footer buttons; Accept and Reject unless the journey says otherwise. */
  acceptLabel?: string;
  rejectLabel?: string;
  acceptDisabled?: boolean;
  rejectDisabled?: boolean;
  /** Why the last Accept failed, shown under the buttons. */
  error?: string | null;
  /** Replaces the line that explains what Accept does. */
  intro?: string;
};

function changeHeading(change: AiFieldChange) {
  const field = FIELD_LABEL[change.field] ?? change.field;
  if (change.section === 'profile') {
    return field;
  }
  if (change.field === 'add') {
    return `${SECTION_LABEL[change.section]} · Add`;
  }
  const entry = change.title ?? `Entry ${(change.index ?? 0) + 1}`;
  return `${SECTION_LABEL[change.section]} · ${entry} · ${field}`;
}

function keptLine(sections: AiItemSection[]) {
  const names = sections.map((section) => SECTION_LABEL[section].toLowerCase()).join(', ');
  return `The suggestions added or removed entries in ${names}, so those sections kept your entries.`;
}

function changeKey(change: AiFieldChange) {
  return change.id ?? `${change.section}:${change.index ?? ''}:${change.field}`;
}

export function ProposalReview({
  review,
  writingVoiceVersion,
  onAccept,
  onReject,
  confirmed,
  onToggleConfirmed,
  acceptLabel = 'Accept',
  rejectLabel = 'Reject',
  acceptDisabled = false,
  rejectDisabled = false,
  error,
  intro,
}: ProposalReviewProps) {
  const needsConfirming = review.changes.some((change) => change.needsConfirmation);
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">Suggested edits</h2>
        {writingVoiceVersion != null ? (
          <Badge variant="secondary">Written in your voice (v{writingVoiceVersion})</Badge>
        ) : null}
      </div>
      {review.summary ? <p className="text-sm">{review.summary}</p> : null}
      <p className="text-sm text-muted-foreground">
        {intro ?? (needsConfirming
          ? 'Your resume is unchanged until you accept. Accept applies the suggestions below. A suggestion that adds something new applies only if you confirm it is true.'
          : 'Your resume is unchanged until you accept. Accept applies every suggestion below.')}
      </p>
      {review.skipped ? (
        <p className="text-sm text-muted-foreground">
          {review.skipped === 1
            ? 'One suggestion was left out because it no longer matched your resume or did not fit the form.'
            : `${review.skipped} suggestions were left out because they no longer matched your resume or did not fit the form.`}
        </p>
      ) : null}
      {review.keptSections.length ? (
        <p className="text-sm text-muted-foreground">{keptLine(review.keptSections)}</p>
      ) : null}
      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          {review.changes.length ? (
            review.changes.map((change) => (
              <div key={changeKey(change)} className="flex flex-col gap-2">
                <h3 className="text-md font-medium">{changeHeading(change)}</h3>
                {change.reason ? <p className="text-sm text-muted-foreground">{change.reason}</p> : null}
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="rounded-md border border-input p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Before</p>
                    <p className="whitespace-pre-line text-sm">{change.before || 'Empty'}</p>
                  </div>
                  <div className="rounded-md border border-primary/40 p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">After</p>
                    <p className="whitespace-pre-line text-sm">{change.after}</p>
                  </div>
                </div>
                {change.needsConfirmation && change.id ? (
                  <label className="flex items-start gap-2 rounded-md bg-muted p-3 text-sm">
                    <Checkbox
                      className="mt-0.5"
                      checked={confirmed?.has(change.id) ?? false}
                      onCheckedChange={() => onToggleConfirmed?.(change.id as string)}
                      aria-label={`Confirm: ${changeHeading(change)}`}
                    />
                    <span className="flex flex-col gap-1">
                      <span className="font-medium">This is true</span>
                      {change.claims?.length ? (
                        <ul className="list-disc pl-4 text-muted-foreground">
                          {change.claims.map((claim) => <li key={claim}>{claim}</li>)}
                        </ul>
                      ) : null}
                    </span>
                  </label>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No edits were suggested for this resume.</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onReject} disabled={rejectDisabled}>
            {rejectLabel}
          </Button>
          <Button type="button" onClick={onAccept} disabled={acceptDisabled}>
            {acceptLabel}
          </Button>
        </CardFooter>
      </Card>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
