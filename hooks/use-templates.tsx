'use client';
import Image from 'next/image';
import { Template } from '@pdf-tlv/resume';
import { findTemplate, listResumeTemplates } from '@lib/templates';
import { TemplateKey } from '@lib/types';
import { useEffect } from 'react';

type TemplateParams = {
  selectedTemplate?: TemplateKey;
  level: 'entry' | 'mid' | 'senior';
  onSelect: (template: Template, key: TemplateKey) => void;
};

export const useTemplates = ({ selectedTemplate, level, onSelect }: TemplateParams) => {
  const templates = listResumeTemplates();

  useEffect(() => {
    const template = findTemplate(selectedTemplate);
    if (template) {
      onSelect(template.template, template.key);
    }
    // Parent callbacks are often inline; only re-run when the selected key changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [selectedTemplate]);

  const handleTemplateClick = (template: Template, key: TemplateKey) => {
    onSelect(template, key);
  };

  return templates[level].map(({ template, name, imageUrl, key }) => (
    <div key={`${level} ${name}`} className={'w-full mx-2 hover:cursor-pointer hover:ring-2 hover:ring-secondary'} onClick={() => handleTemplateClick(template, key)}>
      <div
        className={`relative w-full aspect-[210/297] shadow-md ${
          selectedTemplate === key ? 'border-2 border-blue-500' : ''
        }`}
      >
        <Image src={imageUrl} fill alt={`${level} ${name}`} unoptimized />
      </div>
    </div>
  ));
};
