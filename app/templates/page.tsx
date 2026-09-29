'use client';
import { redirect } from 'next/navigation';
import Templates from '../resume/views/templates';
import { useTemplates } from '@hooks/use-templates';
import {
  TEMPLATES_PAGE_HEADING,
  TEMPLATES_PAGE_INTRO,
  TEMPLATES_RELATED_ATS_HREF,
  TEMPLATES_RELATED_ATS_LABEL,
  TEMPLATES_RELATED_LEAD,
  TEMPLATES_RELATED_PRICING_HREF,
  TEMPLATES_RELATED_PRICING_LABEL,
} from '@/lib/templates-page-copy';
import Link from 'next/link';
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
      heading={TEMPLATES_PAGE_HEADING}
      intro={TEMPLATES_PAGE_INTRO}
      related={(
        <p>
          {TEMPLATES_RELATED_LEAD}{' '}
          <Link href={TEMPLATES_RELATED_ATS_HREF} className="underline">{TEMPLATES_RELATED_ATS_LABEL}</Link>
          {' and '}
          <Link href={TEMPLATES_RELATED_PRICING_HREF} className="underline">{TEMPLATES_RELATED_PRICING_LABEL}</Link>.
        </p>
      )}
      level={level}
      onChangeLevel={setLevel}
    >
      {templates}
    </Templates>
  );
}
