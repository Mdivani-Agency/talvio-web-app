'use client';
import Image from 'next/image';
import { Template } from '@pdf-tlv/resume';
import { listResumeTemplates } from '@lib/clients/resume.client';
import { TemplateKey } from '@lib/types';
import { useQuery } from '@tanstack/react-query';
import { Loading } from '@components/views';

type TemplateParams = {
  selectedTemplate?: TemplateKey;
  level: 'entry' | 'mid' | 'senior';
  onSelect: (template: Template, key: TemplateKey) => void;
};

export const useTemplates = ({ selectedTemplate, level, onSelect }: TemplateParams) => {
  const { data: templates } = useQuery({
    queryKey: ['templates'],
    refetchOnWindowFocus: false,
    queryFn: () => listResumeTemplates(),
    select: (data) => {
      const template = [
        ...data.entry,
        ...data.mid,
        ...data.senior,
      ].find(({ key }) => key === selectedTemplate);

      if (template) {
        onSelect(template.template, template.key);
      }

      return data;
    },
  });

  const handleTemplateClick = (template: Template, key: TemplateKey) => {
    onSelect(template, key);
  };

  if (!templates) {
    return <Loading className='top-0 left-0 h-screen w-screen absolute bg-background'  message="Loading resume templates..." />;
  }

  return templates[level].map(({ template, name, imageUrl, key }) => (
    <div key={`${level} ${name}`} className={'w-full mx-2'} onClick={() => handleTemplateClick(template, key)}>
      <div
        className={`relative w-full aspect-[210/297] shadow-md ${
          selectedTemplate === key ? 'border-2 border-blue-500' : ''
        }`}
      >
        <Image src={imageUrl} fill alt={`${level} ${name}`} />
      </div>
    </div>
  ));
};
