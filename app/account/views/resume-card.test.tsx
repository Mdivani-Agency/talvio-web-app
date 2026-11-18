import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Resume } from '@lib/types';

const allowance = vi.hoisted(() => ({ current: undefined as undefined | { exhausted: boolean; renewsOn: Date } }));
const mutate = vi.hoisted(() => ({ generate: vi.fn(), remove: vi.fn() }));

vi.mock('@app/account/hooks/use-allowance', () => ({ useAllowance: () => ({ allowance: allowance.current }) }));
vi.mock('@app/resume/query/use-generate-pdf', () => ({
  useGenerateResumePdf: () => ({ mutateAsync: mutate.generate, isPending: false, variables: undefined }),
}));
vi.mock('@app/resume/query/use-delete-resume', () => ({ useDeleteResume: () => ({ mutateAsync: mutate.remove }) }));
vi.mock('@app/actions/action.utils', () => ({ submitWrapper: ({ fn }: { fn: () => Promise<unknown> }) => fn() }));
vi.mock('@components/modals', () => ({
  ConfirmModal: ({ isOpen, title, description }: { isOpen: boolean; title: string; description: string }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {description}
      </div>
    ) : null,
}));
vi.mock('@/lib/adapters/resume.adapter', () => ({
  resumeDisplayTitle: (resume: { label?: string }) => resume.label ?? 'Untitled',
  isGeneratedResume: (resume: { media?: { url?: string } }) => Boolean(resume.media?.url),
  groupResumeFamilies: (resumes: Array<{ id: string; parentId?: string }>) =>
    resumes
      .filter((resume) => !resume.parentId)
      .map((original) => ({ id: original.id, original, draft: resumes.find((resume) => resume.parentId === original.id) })),
}));

import { ResumeCard } from './resume-card';

const resume = (fields: Partial<Resume> & { id: string; label: string; parentId?: string; pdf?: boolean }) =>
  ({
    updatedAt: '2026-11-18T10:00:00Z',
    media: fields.pdf ? { url: 'https://example.com/a.pdf' } : undefined,
    ...fields,
  }) as unknown as Resume;

describe('ResumeCard', () => {
  beforeEach(() => {
    allowance.current = { exhausted: false, renewsOn: new Date('2026-12-01T00:00:00Z') };
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows the empty state with Create resume when there are no resumes', () => {
    render(<ResumeCard resumes={[]} />);

    expect(screen.getByRole('heading', { level: 2, name: 'My resumes' })).toBeTruthy();
    expect(screen.getByText('No resumes yet')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Create resume' }).getAttribute('href')).toBe('/resume');
    expect(screen.queryByTestId('resume-row')).toBeNull();
  });

  it('lists each resume as a row with its badge, date, and real buttons', () => {
    render(
      <ResumeCard
        resumes={[
          resume({ id: 'a', label: 'Backend CV', pdf: true }),
          resume({ id: 'a-draft', label: 'Backend CV', parentId: 'a' }),
          resume({ id: 'b', label: 'Draft CV' }),
        ]}
      />,
    );

    const rows = screen.getAllByTestId('resume-row');
    expect(rows.map((row) => row.tagName)).toEqual(['LI', 'LI']);
    const generated = within(rows[0]!);
    expect(generated.getByText('PDF ready')).toBeTruthy();
    expect(generated.getByText('Unpublished draft')).toBeTruthy();
    expect(generated.getByText('Updated Nov 18, 2026')).toBeTruthy();
    expect(generated.getByRole('button', { name: 'Download' })).toBeTruthy();
    expect(generated.getByRole('link', { name: 'Edit Backend CV' }).getAttribute('href')).toBe('/resume/a');
    expect(generated.getByRole('button', { name: 'Delete Backend CV' })).toBeTruthy();

    const draft = within(rows[1]!);
    expect(draft.getByText('Draft')).toBeTruthy();
    expect(draft.queryByText('Unpublished draft')).toBeNull();
    expect(draft.getByRole('button', { name: 'Generate PDF' }).hasAttribute('disabled')).toBe(false);
    expect(screen.getByRole('link', { name: 'Create resume' })).toBeTruthy();
  });

  it('disables Generate PDF with the blocked note when no PDFs are left', () => {
    allowance.current = { exhausted: true, renewsOn: new Date('2026-12-01T00:00:00Z') };
    render(<ResumeCard resumes={[resume({ id: 'b', label: 'Draft CV' })]} />);

    const row = within(screen.getByTestId('resume-row'));
    expect(row.getByText('Next PDF on 1 December')).toBeTruthy();
    expect(row.getByRole('button', { name: 'Generate PDF' }).hasAttribute('disabled')).toBe(true);
  });

  it('shows Load more only when there is a next page', () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(<ResumeCard resumes={[resume({ id: 'b', label: 'Draft CV' })]} hasNextPage onLoadMore={onLoadMore} />);

    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    rerender(<ResumeCard resumes={[resume({ id: 'b', label: 'Draft CV' })]} hasNextPage={false} />);
    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
  });

  it('confirms before deleting, naming the draft when a generated resume has one', () => {
    render(
      <ResumeCard
        resumes={[resume({ id: 'a', label: 'Backend CV', pdf: true }), resume({ id: 'a-draft', label: 'Backend CV', parentId: 'a' })]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete Backend CV' }));
    expect(screen.getByRole('dialog', { name: 'Delete resume' }).textContent).toContain('its unpublished draft');
  });
});
