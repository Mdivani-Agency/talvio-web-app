'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { submitWrapper } from '@app/actions/action.utils';
import { useResumeEditorDocument } from '@app/resume/hooks/use-resume-editor-document';
import { useDeleteResume } from '@app/resume/query/use-delete-resume';
import { useGenerateResumePdf } from '@app/resume/query/use-generate-pdf';
import { fetchResumeFamily } from '@app/resume/query/use-resume';
import { isLabelOnlyPatch, saveResumeEdit } from '@app/resume/query/use-save-resume-edit';
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
  const readOnly = Boolean(hasFamily && viewingOriginal);
  const editorDocument = viewingOriginal && original
    ? resumeToEditorDocument(original)
    : document;

  const recovery = useMemo(() => {
    if (!userId) {
      return null;
    }
    return readMatchingResumeRecovery(storage, { kind: 'user', userId }, [
      resumeId,
      draft?.id,
      original?.id,
    ]);
  }, [draft?.id, original?.id, resumeId, storage, userId]);

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
      const key = resumeDraftStorageKey({ kind: 'user', userId }, draft?.id ?? displayed?.id ?? resumeId);
      if (!next) {
        clearDraft(storage, key);
        return;
      }
      writeDraft(storage, key, next);
    });
    writerRef.current = writer;
    return () => {
      writer.flush();
      if (writerRef.current === writer) {
        writerRef.current = null;
      }
    };
  }, [displayed?.id, draft?.id, resumeId, storage, userId]);

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

  const { mutateAsync: persistEdit } = useMutation({
    mutationFn: async (patch: Partial<Resume>) => {
      if (!userId || !displayed) {
        throw new Error('Sign in to edit a resume');
      }
      const existing = !viewingOriginal && draft ? draft : displayed;
      return saveResumeEdit({ userId, existing, patch });
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['resumes', userId] });
      await queryClient.invalidateQueries({ queryKey: ['resume-family', resumeId] });
      await queryClient.invalidateQueries({ queryKey: ['resume', result.resume.id] });
      if (original) {
        await queryClient.invalidateQueries({ queryKey: ['resume-family', original.id] });
      }
      if (result.created) {
        setViewingOriginal(false);
      }
    },
  });

  const requestEdit = (patch: Partial<Resume>) => {
    if (readOnly && !isLabelOnlyPatch(patch)) {
      return;
    }
    if (displayed && isGeneratedResume(displayed) && !isLabelOnlyPatch(patch)) {
      setPendingPatch(patch);
      setForkOpen(true);
      return;
    }

    void submitWrapper({
      fn: async () => {
        const result = await persistEdit(patch);
        return { id: result.resume.id };
      },
    });
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

  const downloadCurrent = (resume = displayed) =>
    submitWrapper({
      fn: async () => {
        if (!resume) {
          throw new Error('Resume not found');
        }
        if (!isGeneratedResume(resume)) {
          const source = editorDocument ?? resumeToEditorDocument(resume);
          const fieldIssues = resumeSubmissionIssues(source.resume);
          if (fieldIssues.length > 0) {
            setIssues(fieldIssues);
            throw new Error(formatResumeFieldIssues(fieldIssues));
          }
          setIssues([]);
        }
        const result = await generatePdf.mutateAsync(resume);
        if (resume.sourceResumeId && result.media?.url && result.id !== resumeId) {
          router.push(`/resume/${result.id}`);
        }
        return { id: result.id };
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
        downloadPending={generatePdf.isPending}
        family={hasFamily ? {
          viewingOriginal,
          onViewOriginal: () => setViewingOriginal(true),
          onViewDraft: () => setViewingOriginal(false),
          onDiscard: () => setDiscardOpen(true),
        } : null}
        onChange={handleChange}
        onDownload={async (name, label) => {
          if (isGeneratedResume(displayed)) {
            return downloadCurrent();
          }
          const named = name.trim() && (name !== displayed.name || label !== displayed.label)
            ? (await persistEdit({ name, label })).resume
            : displayed;
          apply({ name, label });
          return downloadCurrent(named);
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
              const result = await persistEdit(pendingPatch);
              return { id: result.resume.id };
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
