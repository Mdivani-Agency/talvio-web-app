import { parseResumePresignBody } from '@/lib/clients/media-presign';
import { requireApiUser, unauthorizedResponse } from '@/lib/supabase/require-api-user';

export async function POST(request: Request) {
  let context;
  try {
    context = await requireApiUser(request);
  } catch (error) {
    return unauthorizedResponse(error) ?? Response.json({ error: 'Please sign in' }, { status: 401 });
  }

  const apiKey = process.env.MEDIA_SERVICE_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiKey || !baseUrl) {
    return Response.json({ error: 'Media upload is not configured' }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = parseResumePresignBody(json);
  if ('error' in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/media/presign/${context.user.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({
      name: parsed.name,
      type: 'application/pdf',
      path: 'resume',
    }),
  });

  if (!response.ok) {
    console.error('media presign upstream failed', response.status);
    return Response.json({ error: 'Failed to create upload URL' }, { status: 502 });
  }

  const payload = await response.text();
  return new Response(payload, {
    status: 200,
    headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json' },
  });
}
