'use client';
import { Button } from "@components/ui";
import { Modal } from "@components/views";

import React, { useRef, useState } from 'react';
import { Icon } from '@components/icons';
import { cn } from '@lib/utils';
import { toast } from 'sonner';

export type DragAndDropStatus = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

interface DragAndDropProps {
  onFileUpload: (file: File) => void;
  status: DragAndDropStatus;
  progress: number;
  error?: string;
}

export const DragAndDrop: React.FC<DragAndDropProps> = ({ onFileUpload, status, progress, error }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileUpload(file);
  };

  const handleFileUpload = (file?: File) => {
    if (file && file.type === 'application/pdf') {
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
      {status === 'uploading' && (
        <div className="w-full mt-4">
          <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div className="h-2 bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-secondary-700 mt-1">Uploading... {progress}%</p>
        </div>
      )}
      {status === 'success' && <p className="text-success mt-4">Upload successful!</p>}
      {status === 'error' && <p className="text-error mt-4">{error || 'Upload failed. Please try again.'}</p>}
    </div>
  );
};


type UploadModalProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => void;
};

export const UploadModal = ({ title, isOpen, onClose, onFileUpload }: UploadModalProps) => {
  const [file, setFile] = useState<File | null>(null);

  const handleConfirm = () => {
    if (file) {
      onFileUpload(file);
      onClose();
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose} title={title} className="w-full max-w-md">
      <div className="flex flex-col gap-4">
        <DragAndDrop onFileUpload={setFile} status="idle" progress={0} />
      </div>
      <div className="flex justify-end gap-2">
        <Button disabled={!file} className="w-36" size="sm" variant="secondary" onClick={handleConfirm}>Confirm</Button>
      </div>
    </Modal>
  );
};
