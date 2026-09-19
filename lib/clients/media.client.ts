import { authedFetch } from '@/lib/supabase/authed-fetch';

const MEDIA_API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/media`;

export interface MediaItem {
  key: string;
  userId: string;
  name: string;
  type: string;
  publicUrl: string;
  createdAt?: string;
}

export type PresignedUpload = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
};

export const getDocuments = async (userId: string) => {
  const response = await authedFetch(`${MEDIA_API_URL}/${userId}/records`, {
    method: 'GET',
  });
  return response.json() as Promise<{ items: MediaItem[], nextToken?: string }>;
};

export const fetchPdfFile = async (publicUrl: string) => {
  const response = await fetch(publicUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/pdf',
    }
  });
  return response.blob();
};

export function mediaKeyFromPublicUrl(publicUrl: string, fallback = 'resume.pdf'): string {
  try {
    const path = new URL(publicUrl).pathname.replace(/^\//, '');
    return path || fallback;
  } catch {
    return fallback;
  }
}

export async function createPresignedUpload(input: {
  name: string;
  type?: string;
  path?: string;
}): Promise<PresignedUpload> {
  const response = await fetch('/api/media/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: input.name,
      type: input.type ?? 'application/pdf',
      path: input.path ?? 'resume',
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || 'Failed to create upload URL');
  }

  const data = (await response.json()) as { uploadUrl?: string; publicUrl?: string; key?: string };
  if (!data.uploadUrl || !data.publicUrl) {
    throw new Error('Upload URL was not returned');
  }

  return {
    uploadUrl: data.uploadUrl,
    publicUrl: data.publicUrl,
    key: data.key || mediaKeyFromPublicUrl(data.publicUrl, input.name),
  };
}

export async function putToPresignedUrl(
  uploadUrl: string,
  blob: Blob,
  contentType = 'application/pdf',
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': contentType },
  });
  if (!response.ok) {
    throw new Error('Failed to upload resume PDF');
  }
}

export async function uploadResumePdf(name: string, blob: Blob): Promise<{ url: string; key: string }> {
  const presign = await createPresignedUpload({ name, type: 'application/pdf', path: 'resume' });
  await putToPresignedUrl(presign.uploadUrl, blob, 'application/pdf');
  return { url: presign.publicUrl, key: presign.key };
}
