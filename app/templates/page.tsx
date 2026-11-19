'use client';
import { redirect } from 'next/navigation';
import { useState } from 'react';

import { TEMPLATES_DEFAULT_LEVEL, type TemplatesPageLevel } from '@/lib/templates-page-copy';

import { TemplateGallery } from './views/template-gallery';
import { TemplatesHeader } from './views/templates-header';

export default function TemplatesPage() {
  const [level, setLevel] = useState<TemplatesPageLevel>(TEMPLATES_DEFAULT_LEVEL);

  return (
    <main className="mx-auto w-full max-w-[120rem] px-4 pt-10 pb-14 lg:px-10 lg:pt-[7.2rem] lg:pb-24">
      <TemplatesHeader level={level} onChangeLevel={setLevel} />
      {/* Keyed by level so the carousel starts at the first card. */}
      <TemplateGallery key={level} level={level} onSelect={(key) => redirect(`/resume?template=${key}`)} />
    </main>
  );
}
