import { serviceClient } from './data';

export type SeededResume = {
  id: string;
  name: string;
  label: string | null;
  templateKey: string;
  color: string;
  fontSize: string;
  pdfUrl: string | null;
  pdfMediaKey: string | null;
  sourceResumeId: string | null;
  content: Record<string, unknown>;
  updatedAt: string;
};

type SeedResumeInput = {
  userId: string;
  name: string;
  label?: string | null;
  templateKey?: string;
  color?: string;
  fontSize?: 'sm' | 'md' | 'lg';
  content?: Record<string, unknown>;
  pdfUrl?: string | null;
  pdfMediaKey?: string | null;
  sourceResumeId?: string | null;
  updatedAt?: string;
};

export const SEEDED_RESUME_CONTENT = {
  profile: {
    firstName: 'Ada',
    lastName: 'Owner',
    role: 'Staff Engineer',
  },
  contacts: {
    email: 'ada@talvio.test',
  },
};

export async function seedProfile(userId: string) {
  const client = serviceClient();
  const profile = await client.from('profiles').insert({
    user_id: userId,
    first_name: 'Ada',
    last_name: 'Owner',
    role: 'Staff Engineer',
    seniority: 'senior',
  });
  if (profile.error) {
    throw new Error(profile.error.message);
  }
  const contact = await client.from('contacts').insert({
    user_id: userId,
    kind: 'email',
    value: `${userId}@talvio.test`,
    is_primary: true,
  });
  if (contact.error) {
    throw new Error(contact.error.message);
  }
}

export async function seedResume(input: SeedResumeInput): Promise<string> {
  const inserted = await serviceClient().from('resumes').insert({
    user_id: input.userId,
    name: input.name,
    label: input.label ?? null,
    template_key: input.templateKey ?? 'mid-level-ember',
    color: input.color ?? '#1B1B1B',
    font_size: input.fontSize ?? 'md',
    content: input.content ?? SEEDED_RESUME_CONTENT,
    pdf_url: input.pdfUrl ?? null,
    pdf_media_key: input.pdfMediaKey ?? (input.pdfUrl ? `resume/${input.userId}/${input.name}` : null),
    source_resume_id: input.sourceResumeId ?? null,
    ...(input.updatedAt ? { updated_at: input.updatedAt } : {}),
  }).select('id').single();
  if (inserted.error || !inserted.data) {
    throw new Error(inserted.error?.message ?? `Could not seed ${input.name}`);
  }
  return inserted.data.id as string;
}

export async function listResumes(userId: string): Promise<SeededResume[]> {
  const listed = await serviceClient()
    .from('resumes')
    .select('id, name, label, template_key, color, font_size, pdf_url, pdf_media_key, source_resume_id, content, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (listed.error) {
    throw new Error(listed.error.message);
  }
  return (listed.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    label: (row.label as string | null) ?? null,
    templateKey: row.template_key as string,
    color: row.color as string,
    fontSize: row.font_size as string,
    pdfUrl: (row.pdf_url as string | null) ?? null,
    pdfMediaKey: (row.pdf_media_key as string | null) ?? null,
    sourceResumeId: (row.source_resume_id as string | null) ?? null,
    content: (row.content ?? {}) as Record<string, unknown>,
    updatedAt: row.updated_at as string,
  }));
}

export async function setCreditBalance(userId: string, balance: number) {
  const updated = await serviceClient().from('user_credits').update({ balance }).eq('user_id', userId);
  if (updated.error) {
    throw new Error(updated.error.message);
  }
}

export async function generationLock(resumeId: string) {
  const row = await serviceClient()
    .from('resumes')
    .select('generation_updated_at')
    .eq('id', resumeId)
    .single();
  if (row.error) {
    throw new Error(row.error.message);
  }
  return row.data.generation_updated_at as string | null;
}

export async function creditBalance(userId: string) {
  const credits = await serviceClient()
    .from('user_credits')
    .select('balance')
    .eq('user_id', userId)
    .single();
  if (credits.error || !credits.data) {
    throw new Error(credits.error?.message ?? 'Could not read credits');
  }
  return credits.data.balance as number;
}

export function contentProfile(content: Record<string, unknown>) {
  const profile = content.profile;
  if (!profile || typeof profile !== 'object') {
    return { firstName: '', lastName: '', role: '' };
  }
  const record = profile as Record<string, unknown>;
  return {
    firstName: String(record.firstName ?? ''),
    lastName: String(record.lastName ?? ''),
    role: String(record.role ?? ''),
  };
}
