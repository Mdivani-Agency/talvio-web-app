'use client';

import { PDFDocumentProxy } from 'pdfjs-dist';
// @ts-expect-error TODO: add type declaration later
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { useCallback, useState } from 'react';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

const extractText = async (pdf: PDFDocumentProxy, pageNum: number) => {
  const page = await pdf.getPage(pageNum);
  const textContent = await page.getTextContent({ disableNormalization: true });

  // @ts-expect-error TODO: add type declaration later
  return textContent.items.map((item) => item.str).join(',');
};

export const usePdfText = () => {
  const [parsing, setParsing] = useState(false);
  const [text, setText] = useState<string>('');

  const parsePdf = useCallback(async (file: Buffer) => {
    // Load the PDF document
    setParsing(true);
    try {
      const pdf = await pdfjsLib.getDocument(file).promise;
      const numPages = pdf.numPages;
      const textPromises = [];

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        textPromises.push(extractText(pdf, pageNum));
      }

      const text = await Promise.all(textPromises);
      const textString = text.join('\n');
      setText(textString);

      return textString;
    } finally {
      setParsing(false);
    }
  }, []);

  return { parsePdf, text, parsing };
};
