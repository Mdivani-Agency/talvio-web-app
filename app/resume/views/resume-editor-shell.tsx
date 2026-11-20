'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAllowance } from '@app/account/hooks/use-allowance';
import { AiImproveOverlay } from '@components/ai-improve';
import { DownloadResumeModal } from '@components/modals';
import { normalizeResumeLabel } from '@lib/adapters/resume.adapter';
import { featureFlags } from '@lib/flags';
import type { ResumeFieldIssue } from '@lib/models/resume-document';
import { resolveAvailableTemplate, templateLevelFromKey, type TemplateLevel } from '@lib/resume/resolve-editor';
import type { SaveStatus } from '@lib/resume/save-queue';
import { listResumeTemplates } from '@lib/templates';
import { CurrentTemplateProvider } from '@app/account/create/views/forms/template-context';
import type { PreviewDto } from '@lib/types';
import { cn } from '@lib/utils';

import { DraftBanner } from '../components/draft-banner';
import { EditorTabs, type EditorView } from '../components/editor-tabs';
import { EditorTopBar } from '../components/editor-top-bar';
import { ResumePreview } from '../components/resume-preview';
import { useServiceImprove, type ImproveAccepted, type ImproveSource } from '../hooks/use-service-improve';
import { DesignPanel } from './design-panel';
import { EditResumeView } from './edit-resume-view';

export type ResumeFamilyControls = {
  viewingOriginal: boolean;
  onViewOriginal: () => void;
  onViewDraft: () => void;
  onDiscard: () => void;
};

/** Improve with AI wiring from the page (MDI-426). Shown only with `NEXT_PUBLIC_FLAG_RESUME_AI_IMPROVE`. */
export type ResumeImproveControls = {
  /** Where the session is kept next to the resume draft; null keeps it in memory. */
  storageKey: string | null;
  /** Runs before a session starts; return false to stop (guest sign-in, fork confirmation). */
  onRequest?: () => boolean;
  /** A new value starts a session, for a page that confirmed a fork first. */
  startToken?: number;
  /** The resume row the session is about (LLM service, MDI-221); unsaved resumes leave it null. */
  source?: ImproveSource | null;
  /**
   * Saves an accepted LLM service proposal to the resume (MDI-222) and puts it in the editor
   * without autosave. Without it, Accept only changes the editor (an unsaved resume).
   */
  onSave?: (accepted: ImproveAccepted) => Promise<void>;
};

type ResumeEditorShellProps = {
  document: PreviewDto;
  formKey: string;
  level?: TemplateLevel;
  issues?: ResumeFieldIssue[];
  readOnly?: boolean;
  family?: ResumeFamilyControls | null;
  downloadPending?: boolean;
  isGenerated?: boolean;
  saveStatus?: SaveStatus;
  saveMessage?: string;
  onRetrySave?: () => void;
  onChange: (patch: Partial<PreviewDto>) => void;
  onDownload: (filename: string, label?: string) => boolean | void | Promise<boolean | void>;
  improve?: ResumeImproveControls | null;
  /** A visitor without a session: the top bar links home and offers Sign in. */
  guest?: boolean;
  /** Where Sign in goes for a guest, with the way back to this resume. */
  signInHref?: string;
};

export function ResumeEditorShell({
  document,
  formKey,
  level,
  issues,
  readOnly = false,
  family,
  downloadPending = false,
  isGenerated = false,
  saveStatus,
  saveMessage,
  onRetrySave,
  onChange,
  onDownload,
  improve,
  guest = false,
  signInHref,
}: ResumeEditorShellProps) {
  // Phones show one of Content, Design and Preview; from `md` the panel shows Content or Design beside the preview.
  const [view, setView] = useState<EditorView>('content');
  // The AI overlay sits in the panel, so a session started from the phone's Preview tab brings the panel back.
  const showPanel = () => setView((current) => (current === 'preview' ? 'content' : current));
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadName, setDownloadName] = useState(document.name);
  const [downloadLabel, setDownloadLabel] = useState(document.label ?? '');
  const { allowance } = useAllowance();
  const [aiRevision, setAiRevision] = useState(0);
  const improveEnabled = Boolean(improve) && featureFlags().resumeAiImprove && !readOnly;
  const applyImproved = (resume: PreviewDto['resume']) => {
    onChange({ resume });
    setAiRevision((value) => value + 1);
  };
  // Sessions, questions and proposals come from the LLM service.
  const ai = useServiceImprove({
    resume: document.resume,
    storageKey: improveEnabled ? improve?.storageKey ?? null : null,
    source: improve?.source ?? null,
    onApply: applyImproved,
    onSave: improve?.onSave
      ? async (accepted) => {
        await improve.onSave?.(accepted);
        setAiRevision((value) => value + 1);
      }
      : undefined,
  });
  const startToken = improve?.startToken;
  const lastStartToken = useRef(startToken);
  const startSession = ai.start;

  useEffect(() => {
    if (startToken === lastStartToken.current) {
      return;
    }
    lastStartToken.current = startToken;
    if (improveEnabled) {
      startSession();
    }
  }, [improveEnabled, startSession, startToken]);

  const requestImprove = () => {
    // Also covers a fork confirmed first: that session starts from this request, with the panel already shown.
    showPanel();
    if (improve?.onRequest && improve.onRequest() === false) {
      return;
    }
    ai.start();
  };

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => listResumeTemplates(),
    refetchOnWindowFocus: false,
  });

  const templateItem = resolveAvailableTemplate(document.template);
  const galleryLevel = level ?? templateLevelFromKey(templateItem.key);

  const requestDownload = () => {
    if (isGenerated) {
      void Promise.resolve(onDownload(document.name, document.label));
      return;
    }
    setDownloadName(document.name);
    setDownloadLabel(document.label ?? '');
    setDownloadOpen(true);
  };

  const hasIssues = Boolean(issues && issues.length > 0);
  const title = document.label?.trim() || document.name;

  return (
    <section className="flex h-dvh min-h-0 min-w-0 flex-col overflow-hidden bg-background">
      <EditorTopBar
        title={title}
        label={document.label ?? ''}
        guest={guest}
        draft={Boolean(family)}
        readOnly={readOnly}
        signInHref={signInHref}
        saveStatus={saveStatus}
        saveMessage={saveMessage}
        onRetrySave={onRetrySave}
        onRename={(next) => {
          if (normalizeResumeLabel(next) !== normalizeResumeLabel(document.label)) {
            onChange({ label: next });
          }
        }}
        onDownload={requestDownload}
        onImprove={improveEnabled ? requestImprove : undefined}
        improveDisabled={ai.active}
      />
      {family ? <DraftBanner family={family} /> : null}
      <EditorTabs view={view} onView={setView} hasIssues={hasIssues} variant="phone" className="px-4 pt-3 pb-2 md:hidden" />
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,40rem)_minmax(0,1fr)] lg:grid-cols-[48rem_minmax(0,1fr)]">
        <div
          className={cn(
            'relative min-h-0 flex-col md:flex md:border-r md:border-border',
            view === 'preview' ? 'hidden' : 'flex',
          )}
        >
          {improveEnabled ? <AiImproveOverlay session={ai} /> : null}
          <EditorTabs
            view={view}
            onView={setView}
            hasIssues={hasIssues}
            variant="panel"
            className="hidden flex-none px-6 pt-4 pb-3 md:block"
          />
          <div
            role="tabpanel"
            aria-label={view === 'design' ? 'Design' : 'Content'}
            className={cn(
              'min-h-0 flex-1',
              view === 'design' ? 'overflow-y-auto px-4 pb-6 md:px-6' : 'flex flex-col',
              readOnly && 'pointer-events-none opacity-60',
            )}
          >
            {view === 'design' ? (
              <DesignPanel
                templates={templates}
                level={galleryLevel}
                template={document.template}
                color={document.color}
                fontSize={document.fontSize}
                disabled={readOnly}
                onTemplate={(key) => onChange({ template: key })}
                onColor={(color) => onChange({ color })}
                onFontSize={(fontSize) => onChange({ fontSize })}
              />
            ) : (
              <CurrentTemplateProvider template={{ key: templateItem.key, name: templateItem.name }}>
                <EditResumeView
                  key={`${formKey}:ai${aiRevision}`}
                  className="h-full min-h-0"
                  issues={issues}
                  defaultValues={document.resume}
                  onSubmit={(resume) => onChange({ resume })}
                />
              </CurrentTemplateProvider>
            )}
          </div>
        </div>
        <ResumePreview
          className={cn('min-h-0 md:flex', view === 'preview' ? 'flex' : 'hidden')}
          templateKey={document.template}
          templateName={templateItem.name}
          resume={document.resume}
          fontSize={document.fontSize}
          color={document.color}
          readOnly={readOnly}
          handleChange={(key, value) => onChange({ [key]: value })}
          onDownload={requestDownload}
        />
      </div>
      <DownloadResumeModal
        isOpen={downloadOpen}
        filename={downloadName}
        label={downloadLabel}
        setFilename={setDownloadName}
        setLabel={setDownloadLabel}
        isGenerating={downloadPending}
        isFreeDownload={isGenerated}
        allowance={allowance}
        generateResume={() => {
          void Promise.resolve(onDownload(downloadName, downloadLabel)).then((ok) => {
            if (ok !== false) {
              setDownloadOpen(false);
            }
          }).catch(() => undefined);
        }}
        onClose={() => setDownloadOpen(false)}
        onImprove={improveEnabled ? () => {
          setDownloadOpen(false);
          requestImprove();
        } : undefined}
      />
    </section>
  );
}
