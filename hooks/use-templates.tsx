'use client';
import Image from 'next/image';
import { Template } from '@pdf-tlv/resume';
import { listResumeTemplates } from '@lib/clients/resume.client';
import { TemplateKey, TemplateItem } from '@lib/types';
import { useQuery } from '@tanstack/react-query';
import { Loading } from '@components/views';

type TemplateName = TemplateItem['name'];

type TemplateParams = {
  selectedTemplate: TemplateName;
  level: 'entry' | 'mid' | 'senior';
  onSelect: (template: Template, key: TemplateKey) => void;
};

export const useTemplates = ({ selectedTemplate, level, onSelect }: TemplateParams) => {
  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => listResumeTemplates(),
    refetchOnWindowFocus: false,
  });

  const handleTemplateClick = (template: Template, key: TemplateKey) => {
    onSelect(template, key);
  };

  if (!templates) {
    return <Loading message="Loading resume templates..." />;
  }

  return templates[level].map(({ template, name, imageUrl, key }) => (
    <div key={`${level} ${name}`} className={'w-full mx-2'} onClick={() => handleTemplateClick(template, key)}>
      <div
        className={`relative w-full aspect-[210/297] shadow-md ${
          selectedTemplate === name ? 'border-2 border-blue-500' : ''
        }`}
      >
        <Image src={imageUrl} fill alt={`${level} ${name}`} />
      </div>
    </div>
  ));
};
