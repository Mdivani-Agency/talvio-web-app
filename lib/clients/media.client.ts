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
  /** Headers the upload must send exactly (part of the signature), when the media service returns them. */
  headers?: Record<string, string>;
};

/** Records per request. The media service accepts 50, 100 or 200 (`limit`), and 50 is its default. */
export const DOCUMENTS_PAGE_SIZE = 50;

export type DocumentsPage = { items: MediaItem[]; nextToken?: string };

/**
 * One page of a user's generated PDFs. Pass the `nextToken` from the previous page to get the next one; a page
 * without a `nextToken` is the last.
 */
export const getDocuments = async (userId: string, nextToken?: string): Promise<DocumentsPage> => {
  const params = new URLSearchParams({ limit: String(DOCUMENTS_PAGE_SIZE) });
  if (nextToken) params.set('nextToken', nextToken);
  const response = await authedFetch(`${MEDIA_API_URL}/${userId}/records?${params}`, {
    method: 'GET',
  });
  if (!response.ok) {
    throw new Error('Could not load documents');
  }
  const data = (await response.json()) as { items?: MediaItem[]; nextToken?: string | null };
  if (!Array.isArray(data.items)) {
    throw new Error('Could not load documents');
  }
  return { items: data.items, nextToken: data.nextToken || undefined };
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
  const response = await authedFetch('/api/media/presign', {
    method: 'POST',
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
