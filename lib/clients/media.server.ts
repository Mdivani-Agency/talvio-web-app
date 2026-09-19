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
    }),
  });

  if (!response.ok) {
    console.error('media presign failed', response.status);
    const error = new Error('Failed to create upload URL');
    (error as Error & { status: number }).status = 502;
    throw error;
  }

  const data = (await response.json()) as { uploadUrl?: string; publicUrl?: string; key?: string };
  if (!data.uploadUrl || !data.publicUrl) {
    const error = new Error('Upload URL was not returned');
    (error as Error & { status: number }).status = 502;
    throw error;
  }

  return {
    uploadUrl: data.uploadUrl,
    publicUrl: data.publicUrl,
    key: data.key || mediaKeyFromPublicUrl(data.publicUrl, name),
  };
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
    headers: { 'Content-Type': RESUME_PDF_TYPE },
  });
  if (!response.ok) {
    const error = new Error('Failed to upload resume PDF');
    (error as Error & { status: number }).status = 502;
    throw error;
  }
  return { url: presign.publicUrl, key: presign.key };
}
