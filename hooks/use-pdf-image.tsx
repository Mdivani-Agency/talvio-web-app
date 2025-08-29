'use client';
import { useCallback, useState } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';
// @ts-expect-error TODO: add type declaration later
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

export const pdfUrlToImage = async (pdfUrl: string, pages?: number) => {
  const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
  const numPages = pages && pages < pdf.numPages ? pages : pdf.numPages;
  const imagePromises = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    imagePromises.push(renderPageToImage(pdf, pageNum));
  }

  const images = await Promise.all(imagePromises);
  return images;
}

  const renderPageToImage = async (pdf: PDFDocumentProxy, pageNum: number) => {
    const page = await pdf.getPage(pageNum);
    const scale = 2; // Adjust for quality
    const viewport = page.getViewport({ scale });

    // Create a canvas element
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
      // Render the PDF page into the canvas context
      await page.render({ canvasContext: context, viewport }).promise;
    }

    // Convert the canvas to an image and return the data URL
    return canvas.toDataURL('image/png');
  };

export const usePdfImage = () => {
  const [images, setImages] = useState<string[]>([]);

  const renderPDF = useCallback(async (pdfUrl: string) => {
    const images = await pdfUrlToImage(pdfUrl);
    setImages(images);
  }, []);

  return {
    images,
    renderPDF,
  };
};
