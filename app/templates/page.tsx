'use client';
import { redirect } from 'next/navigation';
import { useState } from 'react';

import { PageContainer } from '@components/views';
import { filterTemplates, listResumeTemplates, templateFilterCounts } from '@lib/templates';
import type { TemplateFilter } from '@/lib/templates-page-copy';

import { TemplateGallery } from './views/template-gallery';
import { TemplatesHeader } from './views/templates-header';

export default function TemplatesPage() {
  const [filter, setFilter] = useState<TemplateFilter | 'all'>('all');
  const all = listResumeTemplates();
  const templates = filterTemplates(all, filter);

  return (
    <PageContainer as="main" className="pt-10 pb-14 lg:pt-[7.2rem] lg:pb-24">
      <TemplatesHeader filter={filter} counts={templateFilterCounts(all)} shown={templates.length} onChangeFilter={setFilter} />
      {/* Keyed by filter so the carousel starts at the first card. */}
      <TemplateGallery key={filter} templates={templates} onSelect={(key) => redirect(`/resume?template=${key}`)} />
    </PageContainer>
  );
}
