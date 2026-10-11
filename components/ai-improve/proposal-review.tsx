import { Badge, Button, Card, CardContent, CardFooter } from '@components/ui';
import type { AiFieldChange, AiItemSection, AiProposalResult } from '@lib/ai-improve/payload';

const SECTION_LABEL: Record<AiFieldChange['section'], string> = {
  profile: 'Profile',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  recommendations: 'Recommendations',
};

const FIELD_LABEL: Record<string, string> = {
  tagline: 'Summary',
  additionalDetails: 'Details',
  achievements: 'Achievements',
  responsibilities: 'Responsibilities',
  keyContributions: 'Key contributions',
};

type ProposalReviewProps = {
  review: AiProposalResult;
  writingVoiceVersion?: number | null;
  onAccept: () => void;
  onReject: () => void;
};

function changeHeading(change: AiFieldChange) {
  const field = FIELD_LABEL[change.field] ?? change.field;
  if (change.section === 'profile') {
    return field;
  }
  const entry = change.title ?? `Entry ${(change.index ?? 0) + 1}`;
  return `${SECTION_LABEL[change.section]} · ${entry} · ${field}`;
}

function keptLine(sections: AiItemSection[]) {
  const names = sections.map((section) => SECTION_LABEL[section].toLowerCase()).join(', ');
  return `The suggestions added or removed entries in ${names}, so those sections kept your entries.`;
}

export function ProposalReview({ review, writingVoiceVersion, onAccept, onReject }: ProposalReviewProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">Suggested edits</h2>
        {writingVoiceVersion != null ? (
          <Badge variant="secondary">Written in your voice (v{writingVoiceVersion})</Badge>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">
        Your resume is unchanged until you accept. Accept applies every suggestion below.
      </p>
      {review.keptSections.length ? (
        <p className="text-sm text-muted-foreground">{keptLine(review.keptSections)}</p>
      ) : null}
      <Card>
        <CardContent className="flex flex-col gap-6 pt-6">
          {review.changes.length ? (
            review.changes.map((change) => (
              <div key={`${change.section}:${change.index ?? ''}:${change.field}`} className="flex flex-col gap-2">
                <h3 className="text-md font-medium">{changeHeading(change)}</h3>
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
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No edits were suggested for this resume.</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onReject}>
            Reject
          </Button>
          <Button type="button" onClick={onAccept}>
            Accept
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
