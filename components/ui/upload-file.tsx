'use client';
import { Button } from "@components/ui";

import React, { useRef } from 'react';
import { Icon } from '@components/icons';
import { cn } from '@lib/utils';
import { toast } from 'sonner';

export type UploadFileStatus = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

interface UploadFileProps {
  onFileUpload: (file: File) => void;
  status: UploadFileStatus;
  error?: string;
}

export const UploadFile: React.FC<UploadFileProps> = ({ onFileUpload, status, error }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && status === 'idle') {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status === 'idle') {
      const file = e.target.files?.[0];
      handleFileUpload(file);
    }
  };

  const handleFileUpload = (file?: File) => {
    if (file && file.type === 'application/pdf' && status === 'idle') {
      onFileUpload(file);
    } else if (file) {
      toast.error('Invalid file type. Please upload a PDF file.');
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center border border-dashed rounded-md p-8 transition-colors',
        status === 'dragging' ? 'border-input bg-background' : 'border-input bg-background/50',
        'relative w-full mx-auto min-h-[200px]',
      )}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
      }}
      onDrop={handleDrop}
      data-testid="drag-and-drop"
    >
      <Icon type="Upload" className="size-12 text-secondary-900 mb-4" />
      <p className="mb-2 text-md text-secondary-900 font-medium">Drag and Drop PDF Resume Here</p>
      <p className="text-md text-secondary-700 text-sm">or</p>
      <Button variant="ghost" onClick={() => inputRef.current?.click()} className="mb-2">
        <Icon type="Upload" className="size-4" />
        <span className="text-sm">Select from your device</span>
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
        data-testid="file-input"
      />
      {status === 'error' && <p className="text-error mt-4">{error || 'Upload failed. Please try again.'}</p>}
    </div>
  );
};
