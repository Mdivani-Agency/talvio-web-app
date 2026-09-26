'use client';
import { redirect } from 'next/navigation';
import Templates from '../resume/views/templates';
import { useTemplates } from '@hooks/use-templates';
import { useState } from 'react';

export default function TemplatesPage() {
  const [level, setLevel] = useState<'entry' | 'mid' | 'senior'>('senior');

  const templates = useTemplates({
    level,
    onSelect: (_, key) => redirect(`/resume?template=${key}`),
  });

  return (
    <Templates
      templatesContainerClassName='grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      level={level}
      onChangeLevel={setLevel}
    >
      {templates}
    </Templates>
  );
}
