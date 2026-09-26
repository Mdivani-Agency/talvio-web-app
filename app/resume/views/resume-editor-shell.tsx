'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Icon } from '@components/icons';
import { DownloadResumeModal } from '@components/modals';
import { AnimatedTransition, Button, Input, Tooltip, TooltipContent, TooltipTrigger } from '@components/ui';
import { normalizeResumeLabel } from '@lib/adapters/resume.adapter';
import type { ResumeFieldIssue } from '@lib/models/resume-document';
import { resolveAvailableTemplate, templateLevelFromKey, type TemplateLevel } from '@lib/resume/resolve-editor';
import { SAVE_STATUS_LABEL, type SaveStatus } from '@lib/resume/save-queue';
import { listResumeTemplates } from '@lib/templates';
import type { PreviewDto } from '@lib/types';
import { cn } from '@lib/utils';

import { ResumePreview } from '../components/resume-preview';
import { EditResumeView } from './edit-resume-view';
import TemplatesView from './templates-view';

export type ResumeFamilyControls = {
  viewingOriginal: boolean;
  onViewOriginal: () => void;
  onViewDraft: () => void;
  onDiscard: () => void;
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
}: ResumeEditorShellProps) {
  const [panel, setPanel] = useState<'templates' | 'form'>('form');
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadName, setDownloadName] = useState(document.name);
  const [downloadLabel, setDownloadLabel] = useState(document.label ?? '');

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

  return (
    <section className="grid h-dvh min-h-0 min-w-0 grid-cols-1 grid-rows-2 overflow-hidden md:h-auto md:grid-cols-5 md:grid-rows-1 md:overflow-visible">
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden md:col-span-2">
        <div className="flex flex-col gap-3 border-b border-input px-4 py-3 pt-16">
          {family ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {family.viewingOriginal
                  ? 'Viewing the generated PDF. This version is read-only.'
                  : 'Editing a draft. Your generated PDF stays downloadable.'}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                {family.viewingOriginal ? (
                  <Button type="button" variant="link" size="sm" className="px-0" onClick={family.onViewDraft}>
                    View draft
                  </Button>
                ) : (
                  <>
                    <Button type="button" variant="link" size="sm" className="px-0" onClick={family.onViewOriginal}>
                      View original
                    </Button>
                    <Button type="button" variant="link" size="sm" className="px-0 text-destructive" onClick={family.onDiscard}>
                      Discard draft
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : null}
          <Input
            key={`${formKey}:label`}
            defaultValue={document.label ?? ''}
            placeholder="Label (optional)"
            aria-label="Resume label"
            onBlur={(event) => {
              const next = event.target.value;
              if (normalizeResumeLabel(next) === normalizeResumeLabel(document.label)) {
                return;
              }
              onChange({ label: next });
            }}
          />
          {saveStatus ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{SAVE_STATUS_LABEL[saveStatus]}</span>
              {saveMessage ? <span>{saveMessage}</span> : null}
              {onRetrySave && (saveStatus === 'failed' || saveStatus === 'conflict') ? (
                <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={onRetrySave}>
                  Retry
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
        <AnimatedTransition
          direction="left"
          className={cn('flex-1 border-r border-input', readOnly && 'pointer-events-none opacity-60')}
          current={panel === 'templates' ? 0 : 1}
        >
          {panel === 'templates' ? (
            <TemplatesView
              templates={templates}
              initialLevel={galleryLevel}
              selectedTemplate={document.template}
              onChange={(_, key) => onChange({ template: key })}
            />
          ) : (
            <EditResumeView
              key={formKey}
              className="h-full min-h-0 pt-4 md:h-screen"
              issues={issues}
              defaultValues={document.resume}
              onSubmit={(resume) => onChange({ resume })}
            />
          )}
        </AnimatedTransition>
      </div>
      <ResumePreview
        className="min-h-0 min-w-0 md:col-span-3 md:pt-16"
        templateKey={document.template}
        resume={document.resume}
        fontSize={document.fontSize}
        color={document.color}
        readOnly={readOnly}
        handleChange={(key, value) => onChange({ [key]: value })}
        onDownload={requestDownload}
        action={(
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="text-muted-foreground font-medium size-8 hover:cursor-pointer"
                title={panel === 'templates' ? 'Edit Resume' : 'Switch Template'}
                aria-label={panel === 'templates' ? 'Edit Resume' : 'Switch Template'}
                onClick={() => setPanel(panel === 'templates' ? 'form' : 'templates')}
              >
                <Icon type={panel === 'templates' ? 'Edit' : 'Switch'} className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {panel === 'templates' ? 'Edit Resume' : 'Switch Template'}
            </TooltipContent>
          </Tooltip>
        )}
      />
      <DownloadResumeModal
        isOpen={downloadOpen}
        filename={downloadName}
        label={downloadLabel}
        setFilename={setDownloadName}
        setLabel={setDownloadLabel}
        isGenerating={downloadPending}
        isFreeDownload={isGenerated}
        generateResume={() => {
          void Promise.resolve(onDownload(downloadName, downloadLabel)).then((ok) => {
            if (ok !== false) {
              setDownloadOpen(false);
            }
          }).catch(() => undefined);
        }}
        onClose={() => setDownloadOpen(false)}
      />
    </section>
  );
}
