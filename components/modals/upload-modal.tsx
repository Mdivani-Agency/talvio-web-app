'use client';
import { Button, UploadFile } from "@components/ui";
import { Modal } from "@components/views";

import React, { useState } from 'react';


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
        <UploadFile onFileUpload={setFile} status="idle" />
      </div>
      <div className="flex justify-end gap-2">
        <Button disabled={!file} className="w-36" size="sm" variant="secondary" onClick={handleConfirm}>Confirm</Button>
      </div>
    </Modal>
  );
};
