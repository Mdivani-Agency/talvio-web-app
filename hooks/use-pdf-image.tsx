'use client';
import { useCallback, useState } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';
// @ts-expect-error TODO: add type declaration later
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

const renderPageToImage = async (pdf: PDFDocumentProxy, pageNum: number) => {
  const page = await pdf.getPage(pageNum);
  try {
    const scale = 2;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
      await page.render({ canvasContext: context, viewport }).promise;
    }

    return canvas.toDataURL('image/png');
  } finally {
    page.cleanup();
  }
};

export const pdfUrlToImage = async (pdfUrl: string, pages?: number) => {
  const loadingTask = pdfjsLib.getDocument(pdfUrl);
  let pdf: PDFDocumentProxy | undefined;

  try {
    const document = await loadingTask.promise;
    pdf = document;
    const numPages = pages && pages < document.numPages ? pages : document.numPages;
    const images = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      images.push(await renderPageToImage(document, pageNum));
    }

    return images;
  } finally {
    try {
      await pdf?.destroy();
    } catch {
      // The document may already have been destroyed by a cancelled load.
    }
    try {
      await loadingTask.destroy();
    } catch {
      // Ignore a second destroy from an aborted loading task.
    }
  }
};

export const usePdfImage = () => {
  const [images, setImages] = useState<string[]>([]);

  const renderPDF = useCallback(async (pdfUrl: string) => {
    const nextImages = await pdfUrlToImage(pdfUrl);
    setImages(nextImages);
  }, []);

  return {
    images,
    renderPDF,
  };
};
