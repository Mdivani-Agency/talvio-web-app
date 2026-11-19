'use client';
import { redirect } from 'next/navigation';
import { useState } from 'react';

import { TEMPLATES_DEFAULT_LEVEL, type TemplatesPageLevel } from '@/lib/templates-page-copy';

import { TemplateGallery } from './views/template-gallery';
import { TemplatesHeader } from './views/templates-header';
import { PageContainer } from '@components/views';

export default function TemplatesPage() {
  const [level, setLevel] = useState<TemplatesPageLevel>(TEMPLATES_DEFAULT_LEVEL);

  return (
    <PageContainer as="main" className="pt-10 pb-14 lg:pt-[7.2rem] lg:pb-24">
      <TemplatesHeader level={level} onChangeLevel={setLevel} />
      {/* Keyed by level so the carousel starts at the first card. */}
      <TemplateGallery key={level} level={level} onSelect={(key) => redirect(`/resume?template=${key}`)} />
    </PageContainer>
  );
}
