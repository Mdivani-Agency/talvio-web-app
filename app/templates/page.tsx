'use client';
import { redirect } from 'next/navigation';
import { useState } from 'react';

import { useTemplates } from '@hooks/use-templates';
import { TEMPLATES_DEFAULT_LEVEL, type TemplatesPageLevel } from '@/lib/templates-page-copy';

import { TemplatesHeader } from './views/templates-header';

export default function TemplatesPage() {
  const [level, setLevel] = useState<TemplatesPageLevel>(TEMPLATES_DEFAULT_LEVEL);

  const templates = useTemplates({
    level,
    onSelect: (_, key) => redirect(`/resume?template=${key}`),
  });

  return (
    <main className="mx-auto w-full max-w-[120rem] px-4 pt-10 pb-14 lg:px-10 lg:pt-[7.2rem] lg:pb-24">
      <TemplatesHeader level={level} onChangeLevel={setLevel} />
      <div className="mt-7 grid w-full grid-cols-1 gap-2 px-2 md:grid-cols-2 lg:mt-12 lg:grid-cols-4">{templates}</div>
    </main>
  );
}
