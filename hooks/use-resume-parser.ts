import { useCallback, useState } from 'react';
import { usePdfText } from './use-pdf-text';
import { parseResume } from '@lib/clients/llm.client';
import { ParsedAccount } from '@lib/types';

type Events = {
  /** `sourceText` is the extracted PDF text or the pasted text that was parsed. */
  onResumeParsed: (parsedResume: ParsedAccount, sourceText: string) => void;
  onError: (error: Error) => void;
};

export const useResumeParser = (events: Events) => {
  const [loading, setLoading] = useState(false);
  const { parsePdf, parsing } = usePdfText();

  const parse = useCallback(
    async (readText: () => Promise<string>) => {
      setLoading(true);
      try {
        const text = await readText();

        const parsedResume = await parseResume(text);

        if (parsedResume) {
          events.onResumeParsed(parsedResume, text);
        }
      } catch (error) {
        events.onError(error as Error);
      } finally {
        setLoading(false);
      }
    },
    [events],
  );

  const parseResumeText = useCallback(
    (file: File) => parse(async () => parsePdf(Buffer.from(await file.arrayBuffer()))),
    [parse, parsePdf],
  );

  const parsePastedText = useCallback(
    (text: string) => parse(async () => text),
    [parse],
  );

  return {
    loading,
    extracting: parsing,
    parseResumeText,
    parsePastedText,
  };
};
