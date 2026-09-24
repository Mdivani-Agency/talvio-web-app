import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { assertLocalServiceOrigins } from '../../scripts/e2e-env.mjs';

export const CREDIT_BOUNDARIES = {
  zero: 0,
  belowPrice: 29,
  exactPrice: 30,
  ample: 300,
} as const;

const RESUME_CONTENT = {
  profile: {
    firstName: 'Ada',
    lastName: 'Owner',
    role: 'Staff Engineer',
  },
  contacts: {
    email: 'ada@talvio.test',
  },
};

export type PersonaKind =
  | 'empty'
  | 'complete'
  | 'draft'
  | 'generated'
  | 'creditsZero'
  | 'creditsBelow'
  | 'creditsExact'
  | 'creditsAmple';

export type Persona = {
  kind: PersonaKind;
  email: string;
  userId: string;
  resumeId?: string;
};

type Identity = {
  project: string;
  worker: number;
  test: string;
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for local E2E`);
  }
  return value;
}

export function serviceClient(): SupabaseClient {
  const env = {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3002',
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:3999',
    NEXT_PUBLIC_SUPABASE_URL: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: requireEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    SUPABASE_SECRET_KEY: requireEnv('SUPABASE_SECRET_KEY'),
    MEDIA_API_BASE_URL: process.env.MEDIA_API_BASE_URL ?? 'http://127.0.0.1:3999',
    OPENAI_BASE_URL: requireEnv('OPENAI_BASE_URL'),
    GOOGLE_FONTS_API_BASE: requireEnv('GOOGLE_FONTS_API_BASE'),
  };
  assertLocalServiceOrigins(env);
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function emailFor(identity: Identity, kind: PersonaKind) {
  const slug = `${identity.project}-${identity.worker}-${identity.test}-${kind}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
  return `e2e-${slug}@talvio.test`;
}

async function createUser(client: SupabaseClient, email: string) {
  const created = await client.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? `Could not create ${email}`);
  }
  return created.data.user.id;
}

async function insertProfile(client: SupabaseClient, userId: string, email: string) {
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
    value: email,
    is_primary: true,
  });
  if (contact.error) {
    throw new Error(contact.error.message);
  }
}

async function insertResume(
  client: SupabaseClient,
  userId: string,
  name: string,
  pdfUrl: string | null,
  sourceResumeId?: string,
) {
  const inserted = await client.from('resumes').insert({
    user_id: userId,
    name,
    template_key: 'mid-level-ember',
    content: RESUME_CONTENT,
    pdf_url: pdfUrl,
    pdf_media_key: pdfUrl ? `resume/${userId}/${name}` : null,
    source_resume_id: sourceResumeId ?? null,
  }).select('id').single();
  if (inserted.error || !inserted.data) {
    throw new Error(inserted.error?.message ?? 'Could not insert resume');
  }
  return inserted.data.id as string;
}

async function setCredits(client: SupabaseClient, userId: string, balance: number) {
  const updated = await client.from('user_credits').update({ balance }).eq('user_id', userId);
  if (updated.error) {
    throw new Error(updated.error.message);
  }
}

function trackUser(personas: Persona[], kind: PersonaKind, email: string, userId: string) {
  const persona: Persona = { kind, email, userId };
  personas.push(persona);
  return persona;
}

export async function provisionPersonas(identity: Identity): Promise<Persona[]> {
  const client = serviceClient();
  const personas: Persona[] = [];

  try {
    const emptyEmail = emailFor(identity, 'empty');
    trackUser(personas, 'empty', emptyEmail, await createUser(client, emptyEmail));

    const completeEmail = emailFor(identity, 'complete');
    const complete = trackUser(
      personas,
      'complete',
      completeEmail,
      await createUser(client, completeEmail),
    );
    await insertProfile(client, complete.userId, completeEmail);

    const draftEmail = emailFor(identity, 'draft');
    const draft = trackUser(personas, 'draft', draftEmail, await createUser(client, draftEmail));
    draft.resumeId = await insertResume(client, draft.userId, 'Draft resume', null);

    const generatedEmail = emailFor(identity, 'generated');
    const generated = trackUser(
      personas,
      'generated',
      generatedEmail,
      await createUser(client, generatedEmail),
    );
    const originalId = await insertResume(
      client,
      generated.userId,
      'Generated resume',
      'http://127.0.0.1:3999/resume/generated.pdf',
    );
    generated.resumeId = await insertResume(client, generated.userId, 'Open draft', null, originalId);

    const creditKinds = [
      ['creditsZero', CREDIT_BOUNDARIES.zero],
      ['creditsBelow', CREDIT_BOUNDARIES.belowPrice],
      ['creditsExact', CREDIT_BOUNDARIES.exactPrice],
      ['creditsAmple', CREDIT_BOUNDARIES.ample],
    ] as const;
    for (const [kind, balance] of creditKinds) {
      const email = emailFor(identity, kind);
      const persona = trackUser(personas, kind, email, await createUser(client, email));
      await setCredits(client, persona.userId, balance);
    }

    return personas;
  } catch (error) {
    try {
      await deletePersonas([...personas]);
    } catch (cleanupError) {
      const reason = error instanceof Error ? error.message : String(error);
      const cleanup = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
      throw new Error(`${reason}; cleanup failed: ${cleanup}`);
    }
    throw error;
  }
}

export async function deletePersonas(personas: Persona[]) {
  const client = serviceClient();
  const errors: string[] = [];
  for (const persona of personas) {
    const removed = await client.auth.admin.deleteUser(persona.userId);
    if (removed.error) {
      errors.push(`${persona.email}: ${removed.error.message}`);
    }
  }
  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }
}

export async function readOwnedRows(persona: Persona) {
  const client = serviceClient();
  const link = await client.auth.admin.generateLink({
    type: 'magiclink',
    email: persona.email,
  });
  if (link.error || !link.data.properties?.email_otp) {
    throw new Error(link.error?.message ?? `Could not mint a session for ${persona.email}`);
  }
  const userClient = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const verified = await userClient.auth.verifyOtp({
    email: persona.email,
    token: link.data.properties.email_otp,
    type: 'magiclink',
  });
  if (verified.error) {
    throw new Error(verified.error.message);
  }
  const [profile, resumes, credits] = await Promise.all([
    userClient.from('profiles').select('user_id').eq('user_id', persona.userId),
    userClient.from('resumes').select('id, pdf_url, source_resume_id').eq('user_id', persona.userId),
    userClient.from('user_credits').select('balance').eq('user_id', persona.userId).single(),
  ]);
  if (profile.error || resumes.error || credits.error || !credits.data) {
    throw new Error(profile.error?.message || resumes.error?.message || credits.error?.message || 'Owned read failed');
  }
  return {
    profileCount: profile.data.length,
    resumes: resumes.data,
    balance: credits.data.balance as number,
  };
}
