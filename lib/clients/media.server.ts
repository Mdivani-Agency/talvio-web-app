import { mediaKeyFromPublicUrl, type PresignedUpload } from '@/lib/clients/media.client';

const RESUME_PDF_TYPE = 'application/pdf';
const RESUME_PDF_PATH = 'resume';

function mediaConfig() {
  const apiKey = process.env.MEDIA_SERVICE_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiKey || !baseUrl) {
    const error = new Error('Media upload is not configured');
    (error as Error & { status: number }).status = 503;
    throw error;
  }
  return { apiKey, baseUrl: baseUrl.replace(/\/$/, '') };
}

export async function createServerPresignedUpload(
  userId: string,
  name: string,
): Promise<PresignedUpload> {
  const { apiKey, baseUrl } = mediaConfig();
  const response = await fetch(`${baseUrl}/media/presign/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({
      name,
      type: RESUME_PDF_TYPE,
      path: RESUME_PDF_PATH,
      // The stored file carries `Content-Disposition: attachment` with this name, so a direct link to it saves the
      // PDF instead of opening it. A media service without the field ignores it and returns no `headers`.
      disposition: 'attachment',
    }),
  });

  if (!response.ok) {
    console.error('media presign failed', response.status);
    const error = new Error('Failed to create upload URL');
    (error as Error & { status: number }).status = 502;
    throw error;
  }

  const data = (await response.json()) as {
    uploadUrl?: string;
    publicUrl?: string;
    key?: string;
    headers?: unknown;
  };
  if (!data.uploadUrl || !data.publicUrl) {
    const error = new Error('Upload URL was not returned');
    (error as Error & { status: number }).status = 502;
    throw error;
  }

  return {
    uploadUrl: data.uploadUrl,
    publicUrl: data.publicUrl,
    key: data.key || mediaKeyFromPublicUrl(data.publicUrl, name),
    ...(signedHeaders(data.headers) ? { headers: signedHeaders(data.headers) } : {}),
  };
}

/** The upload headers the presign signed, when it returned a well-formed set. */
function signedHeaders(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const entries = Object.entries(value);
  if (entries.length === 0 || entries.some(([, header]) => typeof header !== 'string')) {
    return undefined;
  }
  return Object.fromEntries(entries) as Record<string, string>;
}

export async function uploadResumePdfBytes(
  userId: string,
  name: string,
  bytes: Uint8Array,
): Promise<{ url: string; key: string }> {
  const presign = await createServerPresignedUpload(userId, name);
  const response = await fetch(presign.uploadUrl, {
    method: 'PUT',
    body: Buffer.from(bytes),
    // Signed headers must be sent exactly as returned; without them the upload only sets the type.
    headers: presign.headers ?? { 'Content-Type': RESUME_PDF_TYPE },
  });
  if (!response.ok) {
    const error = new Error('Failed to upload resume PDF');
    (error as Error & { status: number }).status = 502;
    throw error;
  }
  return { url: presign.publicUrl, key: presign.key };
}
