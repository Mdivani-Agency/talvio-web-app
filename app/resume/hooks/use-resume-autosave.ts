'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isGeneratedResume, type ResumeContentPatch } from '@/lib/adapters/resume.adapter';
import { createDebouncedWriter, type DebouncedWriter } from '@lib/drafts';
import type { Resume } from '@lib/types';

import { fetchResume } from '../query/use-resume';
import { isLabelOnlyPatch, saveResumeEdit } from '../query/use-save-resume-edit';
import { isResumeConflict } from '../query/use-update-resume';
import {
  createSaveRunner,
  mergeResumePatch,
  type SaveQueueState,
  type SaveStatus,
} from '@/lib/resume/save-queue';

type SaveRunner = ReturnType<typeof createSaveRunner<ResumeContentPatch>>;

type AutosaveOptions = {
  userId?: string;
  seed?: { serverId: string; baseUpdatedAt: string };
  markSaved?: boolean;
  getExisting: () => Resume | undefined;
  getClientDraftId: () => string | undefined;
  onSaved?: (result: { resume: Resume; created: boolean }) => void | Promise<void>;
};

type AutosaveRuntime = {
  runner: SaveRunner;
  writer: DebouncedWriter<ResumeContentPatch>;
  holder: { accumulator: ResumeContentPatch };
};

function createAutosaveRuntime(
  optionsRef: { current: AutosaveOptions },
  savedRef: { current: Resume | undefined },
): AutosaveRuntime {
  const holder = { accumulator: {} as ResumeContentPatch };
  const runner = createSaveRunner<ResumeContentPatch>({
    merge: mergeResumePatch,
    isConflict: isResumeConflict,
    onConflict: async (serverId) => {
      if (!serverId) {
        return undefined;
      }
      const fresh = await fetchResume(serverId);
      return fresh.updatedAt;
    },
    save: async (patch, context) => {
      const current = optionsRef.current;
      const loaded = current.getExisting();
      const saved = savedRef.current;
      let existing = loaded ?? saved;
      if (saved && loaded) {
        const savedIsOpenDraft = saved.sourceResumeId === loaded.id && !isGeneratedResume(saved);
        if (saved.id === loaded.id || (savedIsOpenDraft && !isLabelOnlyPatch(patch))) {
          existing = saved;
        }
      }
      if (!current.userId || !existing) {
        throw new Error('Sign in to edit a resume');
      }
      const result = await saveResumeEdit({
        userId: current.userId,
        existing,
        patch,
        baseUpdatedAt: context.serverId === existing.id ? context.baseUpdatedAt : existing.updatedAt,
        serverId: context.serverId === existing.id ? context.serverId : existing.id,
        clientDraftId: current.getClientDraftId(),
      });
      savedRef.current = result.resume;
      await current.onSaved?.(result);
      return {
        serverId: result.resume.id,
        baseUpdatedAt: result.resume.updatedAt,
      };
    },
  });
  const writer = createDebouncedWriter((patch: ResumeContentPatch) => {
    holder.accumulator = {};
    runner.enqueue(patch);
  });
  return { runner, writer, holder };
}

export function useResumeAutosave(options: AutosaveOptions) {
  const optionsRef = useRef(options);
  const savedRef = useRef<Resume | undefined>(undefined);
  const runtime = useRef<AutosaveRuntime | null>(null);
  const [snapshot, setSnapshot] = useState<SaveQueueState<ResumeContentPatch>>({
    status: 'saved-locally',
  });
  const seedId = options.seed?.serverId;
  const seedUpdatedAt = options.seed?.baseUpdatedAt;
  const markSaved = options.markSaved;

  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    const active = runtime.current ?? createAutosaveRuntime(optionsRef, savedRef);
    runtime.current = active;
    setSnapshot(active.runner.getState());
    const unsubscribe = active.runner.subscribe(() => {
      setSnapshot(active.runner.getState());
    });
    return () => {
      active.writer.flush();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!seedId || !seedUpdatedAt) {
      return;
    }
    runtime.current?.runner.seed(
      { serverId: seedId, baseUpdatedAt: seedUpdatedAt },
      markSaved,
    );
  }, [markSaved, seedId, seedUpdatedAt]);

  const schedule = useCallback((patch: ResumeContentPatch) => {
    const active = runtime.current;
    if (!active) {
      return;
    }
    active.holder.accumulator = mergeResumePatch(active.holder.accumulator, patch);
    active.writer.schedule(active.holder.accumulator);
  }, []);

  const flush = useCallback(async (patch?: ResumeContentPatch) => {
    const active = runtime.current;
    if (!active) {
      return optionsRef.current.getExisting();
    }
    if (patch) {
      active.holder.accumulator = mergeResumePatch(active.holder.accumulator, patch);
      active.writer.schedule(active.holder.accumulator);
    }
    active.writer.flush();
    await active.runner.whenIdle();
    return savedRef.current ?? optionsRef.current.getExisting();
  }, []);

  const retry = useCallback(async () => {
    await runtime.current?.runner.retry();
    return runtime.current?.runner.getState();
  }, []);

  const beginGenerating = useCallback(() => {
    runtime.current?.runner.beginGenerating();
  }, []);

  const finishGenerating = useCallback((ok: boolean, message?: string) => (
    runtime.current?.runner.finishGenerating(ok, message)
  ), []);

  const remember = useCallback((resume: Resume) => {
    savedRef.current = resume;
  }, []);

  return useMemo(() => ({
    status: snapshot.status as SaveStatus,
    message: snapshot.error,
    schedule,
    flush,
    retry,
    beginGenerating,
    finishGenerating,
    remember,
  }), [
    beginGenerating,
    finishGenerating,
    flush,
    remember,
    retry,
    schedule,
    snapshot.error,
    snapshot.status,
  ]);
}
