'use client';
import { useRouter } from 'next/navigation';
import Templates from '../resume/views/templates';

export default function TemplatesPage() {
  const router = useRouter();
  return (
    <Templates
      templatesContainerClassName='grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      initialLevel='senior'
      onSelect={(_, key) => {
        router.push(`/resume?template=${key}`);
      }} />
  );
}
