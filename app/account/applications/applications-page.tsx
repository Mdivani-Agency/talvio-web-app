'use client';

import { Plus, Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useMediaQuery } from 'usehooks-ts';

import { submitWrapper } from '@app/actions/action.utils';
import { Button, Input } from '@components/ui';
import { ErrorView, Loading, PageContainer } from '@components/views';
import {
  ADD_APPLICATION_LABEL,
  APPLICATIONS_ERROR_BODY,
  APPLICATIONS_ERROR_TITLE,
  APPLICATIONS_LOADING,
  APPLICATIONS_TITLE,
  MOVE_FAILED_MESSAGE,
  NO_MATCHING_CARDS,
  NO_SEARCH_MATCHES,
  SEARCH_LABEL,
  SEARCH_PLACEHOLDER,
  applicationsSummary,
  filteredSummary,
} from '@/lib/applications-copy';
import { useUserSession } from '@lib/providers';
import { boardColumnOf, isClosedStage, type AddApplicationFormValues } from '@lib/schema/application.schema';
import type { ApplicationStage, BoardColumn, ClosedStage, JobApplication } from '@lib/types';

import {
  cardMatches,
  countActive,
  groupByColumn,
  labelFilterOptions,
  labelsFromSearchParams,
  movePatch,
  searchWithLabels,
  sortOrderAtEnd,
  toggleLabel,
} from './board';
import { useApplications } from './query/use-applications';
import { useCreateApplication } from './query/use-create-application';
import { useUpdateApplication } from './query/use-update-application';
import { AddApplicationDialog } from './views/add-application-dialog';
import { Board } from './views/board';
import { EmptyState } from './views/empty-state';
import { LabelFilters } from './views/label-filters';
import { OutcomeDialog } from './views/outcome-dialog';
import { PhoneBoard } from './views/phone-board';

type PendingClose = { application: JobApplication; sortOrder: number };

export default function ApplicationsPage() {
  const { session } = useUserSession();
  const userId = session?.user?.id;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const desktop = useMediaQuery('(min-width: 768px)', { initializeWithValue: false });

  const applicationsQuery = useApplications(userId);
  const createApplication = useCreateApplication(userId);
  const updateApplication = useUpdateApplication(userId);

  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [pendingClose, setPendingClose] = useState<PendingClose | null>(null);
  const pickedLabels = useMemo(() => labelsFromSearchParams(searchParams), [searchParams]);
  const now = new Date();

  if (!userId || applicationsQuery.isLoading) {
    return <Loading message={APPLICATIONS_LOADING} />;
  }
  // A failed load is an error, never an empty board.
  if (applicationsQuery.isError || !applicationsQuery.data) {
    return (
      <ErrorView
        title={APPLICATIONS_ERROR_TITLE}
        body={APPLICATIONS_ERROR_BODY}
        reset={() => void applicationsQuery.refetch()}
      />
    );
  }

  const applications = applicationsQuery.data;
  const allColumns = groupByColumn(applications);
  const labelOptions = labelFilterOptions(applications);
  // Picked labels no card carries any more are ignored, so a stale URL cannot empty the board.
  const activeLabels = pickedLabels.filter((name) =>
    labelOptions.some((label) => label.name.toLowerCase() === name.toLowerCase()),
  );
  const filter = { search: desktop ? search : '', labels: activeLabels };
  const filtering = filter.search.trim() !== '' || activeLabels.length > 0;
  const shown = applications.filter((application) => cardMatches(application, filter));
  const columns = groupByColumn(shown);
  const emptyHint = activeLabels.length > 0 ? NO_MATCHING_CARDS : filter.search.trim() ? NO_SEARCH_MATCHES : undefined;

  const setLabels = (labels: string[]) => {
    router.replace(`${pathname}${searchWithLabels(searchParams.toString(), labels)}`, { scroll: false });
  };

  const save = (application: JobApplication, stage: ApplicationStage, sortOrder: number) =>
    submitWrapper({
      fn: async () => {
        await updateApplication.mutateAsync({ id: application.id, patch: movePatch(application, stage, sortOrder, new Date()) });
        return { id: application.id };
      },
      errorMessage: MOVE_FAILED_MESSAGE,
    });

  /** A drop on the board. Dropping a card into Closed from another column asks how it ended. */
  const handleDrop = (application: JobApplication, column: BoardColumn, sortOrder: number) => {
    if (column === 'closed' && !isClosedStage(application.stage)) {
      setPendingClose({ application, sortOrder });
      return;
    }
    void save(application, column === 'closed' ? application.stage : column, sortOrder);
  };

  /** The Move to… menu puts the card at the end of its new column. */
  const handleMove = (application: JobApplication, stage: ApplicationStage) => {
    const target = allColumns[boardColumnOf(stage)].filter((card) => card.id !== application.id);
    void save(application, stage, sortOrderAtEnd(target));
  };

  const handleCreate = async (values: AddApplicationFormValues, stage: ApplicationStage) => {
    const created = await createApplication.mutateAsync({
      values,
      sortOrder: sortOrderAtEnd(allColumns[boardColumnOf(stage)]),
    });
    return { id: created.id };
  };

  const total = applications.length;

  return (
    <PageContainer as="section" className="flex flex-col gap-5 py-5 md:py-8">
      <header className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[2.4rem] leading-[1.25] font-semibold text-primary md:text-[2.8rem]">{APPLICATIONS_TITLE}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtering ? filteredSummary(shown.length, total) : applicationsSummary(total, countActive(applications))}
          </p>
        </div>
        {total > 0 ? (
          <label className="relative hidden items-center md:flex">
            <span className="sr-only">{SEARCH_LABEL}</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 z-10 size-[1.6rem] text-muted-foreground" />
            <Input
              type="search"
              value={search}
              placeholder={SEARCH_PLACEHOLDER}
              onChange={(event) => setSearch(event.target.value)}
              className="h-[4.4rem] w-[20rem] pl-9"
            />
          </label>
        ) : null}
        <Button type="button" className="h-[4.4rem] text-[1.5rem]" onClick={() => setAddOpen(true)}>
          <Plus aria-hidden="true" className="size-[1.8rem]" />
          {ADD_APPLICATION_LABEL}
        </Button>
      </header>

      <LabelFilters
        options={labelOptions}
        picked={activeLabels}
        onToggle={(name) => setLabels(toggleLabel(activeLabels, name))}
        onClear={() => setLabels([])}
      />

      {total === 0 ? (
        <EmptyState onAdd={() => setAddOpen(true)} />
      ) : desktop ? (
        <Board columns={columns} now={now} emptyHint={emptyHint} onDrop={handleDrop} onMove={handleMove} />
      ) : (
        <PhoneBoard columns={columns} now={now} emptyHint={emptyHint} onMove={handleMove} />
      )}

      <AddApplicationDialog open={addOpen} userId={userId} onOpenChange={setAddOpen} onCreate={handleCreate} />
      <OutcomeDialog
        application={pendingClose?.application ?? null}
        onCancel={() => setPendingClose(null)}
        onPick={(stage: ClosedStage) => {
          if (pendingClose) {
            void save(pendingClose.application, stage, pendingClose.sortOrder);
          }
          setPendingClose(null);
        }}
      />
    </PageContainer>
  );
}
