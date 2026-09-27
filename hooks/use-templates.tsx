'use client';
import Image from 'next/image';
import { Template } from '@pdf-tlv/resume';
import { listResumeTemplates } from '@lib/templates';
import { TemplateKey } from '@lib/types';

type TemplateParams = {
  selectedTemplate?: TemplateKey;
  level: 'entry' | 'mid' | 'senior';
  onSelect: (template: Template, key: TemplateKey) => void;
};

export const useTemplates = ({ selectedTemplate, level, onSelect }: TemplateParams) => {
  const templates = listResumeTemplates();

  return templates[level].map(({ template, name, imageUrl, key }) => (
    <button
      type="button"
      key={key}
      aria-pressed={selectedTemplate === key}
      className={'w-full mx-2 hover:cursor-pointer hover:ring-2 hover:ring-secondary'}
      onClick={() => onSelect(template, key)}
    >
      <div
        className={`relative w-full aspect-[210/297] shadow-md ${
          selectedTemplate === key ? 'border-2 border-blue-500' : ''
        }`}
      >
        <Image src={imageUrl} fill alt={`${level} ${name}`} unoptimized />
      </div>
    </button>
  ));
};
