'use client';

import { useCallback, useRef, useState } from 'react';

import type { PreviewDto } from '@lib/types';
import { resolveResumeEditorDocument, type ResumeEditorSource } from '@lib/resume/resolve-editor';

export function useResumeEditorDocument() {
  const seededRef = useRef(false);
  const [document, setDocument] = useState<PreviewDto | null>(null);
  const [formRevision, setFormRevision] = useState(0);

  const initialize = useCallback((source: ResumeEditorSource) => {
    if (seededRef.current) {
      return;
    }
    seededRef.current = true;
    setDocument(resolveResumeEditorDocument(source));
  }, []);

  const apply = useCallback((patch: Partial<PreviewDto>) => {
    setDocument((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        ...patch,
        resume: patch.resume ?? current.resume,
      };
    });
  }, []);

  const replaceDocument = useCallback((next: PreviewDto) => {
    setDocument(resolveResumeEditorDocument({ selected: next }));
    setFormRevision((value) => value + 1);
  }, []);

  return {
    document,
    formRevision,
    initialize,
    apply,
    replaceDocument,
  };
}
