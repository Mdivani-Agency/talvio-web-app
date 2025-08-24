import { useCallback, useState } from 'react';
import { usePdfText } from './use-pdf-text';
import { parseResume } from '@lib/clients/llm.client';
import { ParsedAccount } from '@lib/types';

type Events = {
  onResumeParsed: (parsedResume: ParsedAccount) => void;
  onError: (error: Error) => void;
};

export const useResumeParser = (events: Events) => {
  const [loading, setLoading] = useState(false);
  const { parsePdf, parsing } = usePdfText();

  const parseResumeText = useCallback(
    async (file: File) => {
      setLoading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const text = await parsePdf(Buffer.from(arrayBuffer));

        const parsedResume = await parseResume(text);

        if (parsedResume) {
          events.onResumeParsed(parsedResume);
        }
      } catch (error) {
        events.onError(error as Error);
      } finally {
        setLoading(false);
      }
    },
    [parsePdf, events],
  );

  return {
    loading,
    extracting: parsing,
    parseResumeText,
  };
};
