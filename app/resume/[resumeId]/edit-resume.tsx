'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { submitWrapper } from '@app/actions/action.utils';
import { useResumeEditorDocument } from '@app/resume/hooks/use-resume-editor-document';
import { useResumeAutosave } from '@app/resume/hooks/use-resume-autosave';
import { useDeleteResume } from '@app/resume/query/use-delete-resume';
import { useGenerateResumePdf } from '@app/resume/query/use-generate-pdf';
import { fetchResumeFamily } from '@app/resume/query/use-resume';
import { isLabelOnlyPatch } from '@app/resume/query/use-save-resume-edit';
import { ConfirmModal } from '@components/modals';
import { Loading } from '@components/views';
import { isGeneratedResume } from '@lib/adapters/resume.adapter';
import {
  browserStorage,
  buildResumeDocumentDraft,
  clearDraft,
  createDebouncedWriter,
  readDraft,
  resumeDraftStorageKey,
  writeDraft,
  type DebouncedWriter,
  type VersionedDraft,
} from '@lib/drafts';
import { formatResumeFieldIssues, resumeSubmissionIssues, type ResumeFieldIssue } from '@lib/models/resume-document';
import {
  displayedFamilyResume,
  readMatchingResumeRecovery,
  recoveryDocumentIds,
  resumeToEditorDocument,
} from '@lib/resume/resolve-editor';
import { useUserSession } from '@lib/providers';
import type { PreviewDto, Resume } from '@lib/types';

import { ResumeEditorShell } from '../views/resume-editor-shell';

interface EditResumePageProps {
  resumeId: string;
}

export default function EditResumePage({ resumeId }: EditResumePageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useUserSession();
  const userId = session?.user.id;
  const storage = useMemo(() => browserStorage(), []);
  const [forkOpen, setForkOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [viewingOriginal, setViewingOriginal] = useState(false);
  const [pendingPatch, setPendingPatch] = useState<Partial<Resume>>();
  const [issues, setIssues] = useState<ResumeFieldIssue[]>([]);
  const draftRef = useRef<VersionedDraft | null>(null);
  const writerRef = useRef<DebouncedWriter<VersionedDraft | null> | null>(null);
  const { document, formRevision, initialize, apply, replaceDocument } = useResumeEditorDocument();

  const { data: family, isLoading: isLoadingResume } = useQuery({
    queryKey: ['resume-family', resumeId],
    queryFn: () => fetchResumeFamily(resumeId),
    enabled: !!userId,
  });

  const generatePdf = useGenerateResumePdf(userId);
  const deleteResume = useDeleteResume(userId);

  const original = family?.original;
  const draft = family?.draft;
  const hasFamily = Boolean(original && draft);
  const displayed = displayedFamilyResume({ original, draft, viewingOriginal });
  const recovery = useMemo(() => {
    if (!userId) {
      return null;
    }
    return readMatchingResumeRecovery(
      storage,
      { kind: 'user', userId },
      recoveryDocumentIds({
        resumeId,
        draftId: draft?.id,
        originalId: original?.id,
      }),
    );
  }, [draft?.id, original?.id, resumeId, storage, userId]);
  const readOnly = Boolean(hasFamily && viewingOriginal);
  const editorDocument = viewingOriginal && original
    ? resumeToEditorDocument(original)
    : document;
  const autosave = useResumeAutosave({
    userId,
    seed: displayed
      ? { serverId: displayed.id, baseUpdatedAt: displayed.updatedAt }
      : undefined,
    markSaved: !recovery,
    getExisting: () => displayed,
    getClientDraftId: () => {
      if (!userId || !document) {
        return undefined;
      }
      const documentId = draft?.id ?? displayed?.id ?? resumeId;
      const stored = draftRef.current
        ?? readDraft(storage, resumeDraftStorageKey({ kind: 'user', userId }, documentId)).draft;
      const next = buildResumeDocumentDraft({
        owner: { kind: 'user', userId },
        document,
        existing: stored,
        documentId,
      });
      if (!next) {
        return undefined;
      }
      draftRef.current = next;
      writeDraft(storage, resumeDraftStorageKey({ kind: 'user', userId }, documentId), next);
      return next.draftId;
    },
    onSaved: async (result) => {
      if (draftRef.current) {
        draftRef.current = {
          ...draftRef.current,
          baseUpdatedAt: result.resume.updatedAt,
        };
      }
      await queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
      await queryClient.invalidateQueries({ queryKey: ['resume-family', resumeId] });
      await queryClient.invalidateQueries({ queryKey: ['resume', result.resume.id] });
      if (original) {
        await queryClient.invalidateQueries({ queryKey: ['resume-family', original.id] });
      }
      if (result.created) {
        setViewingOriginal(false);
        if (original && userId) {
          clearDraft(storage, resumeDraftStorageKey({ kind: 'user', userId }, original.id));
        }
      }
    },
  });
  const flushedRecovery = useRef(false);

  useEffect(() => {
    const saved = displayedFamilyResume({ original, draft, viewingOriginal: false }) ?? original ?? draft;
    if (!saved) {
      return;
    }
    initialize({
      recovery,
      saved: resumeToEditorDocument(saved),
    });
  }, [draft, initialize, original, recovery]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    const writer = createDebouncedWriter((next: VersionedDraft | null) => {
      const documentId = draft?.id ?? displayed?.id ?? resumeId;
      const key = resumeDraftStorageKey({ kind: 'user', userId }, documentId);
      if (!next) {
        clearDraft(storage, key);
        return;
      }
      writeDraft(storage, key, next);
      if (original?.id && original.id !== documentId) {
        clearDraft(storage, resumeDraftStorageKey({ kind: 'user', userId }, original.id));
      }
    });
    writerRef.current = writer;

    const flush = () => writer.flush();
    const onVisibility = () => {
      if (window.document.visibilityState === 'hidden') {
        flush();
      }
    };
    window.addEventListener('pagehide', flush);
    window.document.addEventListener('visibilitychange', onVisibility);

    return () => {
      flush();
      window.removeEventListener('pagehide', flush);
      window.document.removeEventListener('visibilitychange', onVisibility);
      if (writerRef.current === writer) {
        writerRef.current = null;
      }
    };
  }, [displayed?.id, draft?.id, original?.id, resumeId, storage, userId]);

  useEffect(() => {
    if (!userId || !document || viewingOriginal) {
      return;
    }
    const documentId = draft?.id ?? displayed?.id ?? resumeId;
    const existing = draftRef.current ?? readDraft(storage, resumeDraftStorageKey({ kind: 'user', userId }, documentId)).draft;
    const next = buildResumeDocumentDraft({
      owner: { kind: 'user', userId },
      document,
      existing,
      documentId,
    });
    if (!next || !writerRef.current) {
      return;
    }
    draftRef.current = next;
    writerRef.current.schedule(next);
  }, [displayed?.id, document, draft?.id, resumeId, storage, userId, viewingOriginal]);

  useEffect(() => {
    if (flushedRecovery.current || viewingOriginal || !document || !recovery || !displayed) {
      return;
    }
    if (isGeneratedResume(displayed)) {
      return;
    }
    flushedRecovery.current = true;
    autosave.schedule({
      metadata: document.resume,
      template: document.template,
      color: document.color,
      fontSize: document.fontSize,
      name: document.name,
      label: document.label,
    });
  }, [autosave, displayed, document, recovery, viewingOriginal]);

  const requestEdit = (patch: Partial<Resume>) => {
    if (readOnly && !isLabelOnlyPatch(patch)) {
      return;
    }
    if (displayed && isGeneratedResume(displayed) && !isLabelOnlyPatch(patch)) {
      setPendingPatch(patch);
      setForkOpen(true);
      return;
    }
    autosave.schedule(patch);
  };

  const handleChange = (patch: Partial<PreviewDto>) => {
    if (readOnly && patch.label === undefined) {
      return;
    }
    if (!viewingOriginal) {
      apply(patch);
    }
    if (patch.resume) {
      setIssues([]);
    }
    requestEdit({
      metadata: patch.resume,
      template: patch.template,
      color: patch.color,
      fontSize: patch.fontSize,
      name: patch.name,
      label: patch.label,
    });
  };

  const generateSaved = (resume: Resume) =>
    submitWrapper({
      fn: async () => {
        const alreadyGenerated = isGeneratedResume(resume);
        if (!alreadyGenerated) {
          const source = editorDocument ?? resumeToEditorDocument(resume);
          const fieldIssues = resumeSubmissionIssues(source.resume);
          if (fieldIssues.length > 0) {
            setIssues(fieldIssues);
            throw new Error(formatResumeFieldIssues(fieldIssues));
          }
          setIssues([]);
          autosave.beginGenerating();
        }
        try {
          const result = await generatePdf.mutateAsync(resume);
          if (!alreadyGenerated) {
            autosave.remember(result);
            await autosave.finishGenerating(true);
          }
          if (resume.sourceResumeId && result.media?.url && result.id !== resumeId) {
            router.push(`/resume/${result.id}`);
          }
          return { id: result.id };
        } catch (error) {
          if (!alreadyGenerated) {
            const message = error instanceof Error ? error.message : 'Failed to generate PDF';
            await autosave.finishGenerating(false, message);
          }
          throw error;
        }
      },
    });

  if (isLoadingResume) {
    return <Loading message="Loading resume..." />;
  }

  if (!displayed) {
    return (
      <div className="h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">Resume not found</h1>
      </div>
    );
  }

  if (!editorDocument) {
    return <Loading message="Loading resume..." />;
  }

  return (
    <>
      <ResumeEditorShell
        document={editorDocument}
        formKey={`${viewingOriginal ? 'original' : 'draft'}:${displayed.id}:${formRevision}`}
        issues={issues}
        readOnly={readOnly}
        isGenerated={isGeneratedResume(displayed)}
        downloadPending={generatePdf.isPending || autosave.status === 'saving' || autosave.status === 'generating'}
        saveStatus={autosave.status}
        saveMessage={autosave.message}
        onRetrySave={() => autosave.retry()}
        family={hasFamily ? {
          viewingOriginal,
          onViewOriginal: () => setViewingOriginal(true),
          onViewDraft: () => setViewingOriginal(false),
          onDiscard: () => setDiscardOpen(true),
        } : null}
        onChange={handleChange}
        onDownload={async (name, label) => {
          if (viewingOriginal && original) {
            return generateSaved(original);
          }
          if (isGeneratedResume(displayed)) {
            return generateSaved(displayed);
          }
          return submitWrapper({
            fn: async () => {
              const saved = await autosave.flush({
                metadata: editorDocument.resume,
                template: editorDocument.template,
                color: editorDocument.color,
                fontSize: editorDocument.fontSize,
                name,
                label,
              });
              if (!saved) {
                throw new Error('Resume not found');
              }
              apply({ name, label });
              const alreadyGenerated = isGeneratedResume(saved);
              if (!alreadyGenerated) {
                const fieldIssues = resumeSubmissionIssues(editorDocument.resume);
                if (fieldIssues.length > 0) {
                  setIssues(fieldIssues);
                  throw new Error(formatResumeFieldIssues(fieldIssues));
                }
                setIssues([]);
                autosave.beginGenerating();
              }
              try {
                const result = await generatePdf.mutateAsync(saved);
                if (!alreadyGenerated) {
                  autosave.remember(result);
                  await autosave.finishGenerating(true);
                }
                if (saved.sourceResumeId && result.media?.url && result.id !== resumeId) {
                  router.push(`/resume/${result.id}`);
                }
                return { id: result.id };
              } catch (error) {
                if (!alreadyGenerated) {
                  const message = error instanceof Error ? error.message : 'Failed to generate PDF';
                  await autosave.finishGenerating(false, message);
                }
                throw error;
              }
            },
          });
        }}
      />
      <ConfirmModal
        isOpen={forkOpen}
        title="Create a draft"
        description="This creates a draft. Your current PDF stays downloadable."
        onClose={() => {
          setForkOpen(false);
          setPendingPatch(undefined);
        }}
        onConfirm={() => {
          if (!pendingPatch) {
            return;
          }
          void submitWrapper({
            fn: async () => {
              const saved = await autosave.flush(pendingPatch);
              if (!saved) {
                throw new Error('Resume not found');
              }
              return { id: saved.id };
            },
            successMessage: 'Draft created',
          });
        }}
      />
      <ConfirmModal
        isOpen={discardOpen}
        title="Discard draft"
        description="This deletes the unpublished draft. The generated PDF stays downloadable."
        onClose={() => setDiscardOpen(false)}
        onConfirm={() => {
          if (!draft || !original || !userId) {
            return;
          }
          void submitWrapper({
            fn: async () => {
              await deleteResume.mutateAsync(draft.id);
              writerRef.current?.cancel();
              clearDraft(storage, resumeDraftStorageKey({ kind: 'user', userId }, draft.id));
              if (resumeId === draft.id) {
                router.push(`/resume/${original.id}`);
              }
              await queryClient.invalidateQueries({ queryKey: ['resume-family', resumeId] });
              await queryClient.invalidateQueries({ queryKey: ['resume-family', original.id] });
              replaceDocument(resumeToEditorDocument(original));
              setViewingOriginal(true);
              return { id: draft.id };
            },
            successMessage: 'Draft discarded',
          });
        }}
      />
    </>
  );
}
