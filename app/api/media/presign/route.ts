import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Please sign in' }, { status: 401 });
  }

  const apiKey = process.env.MEDIA_SERVICE_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiKey || !baseUrl) {
    return Response.json({ error: 'Media upload is not configured' }, { status: 503 });
  }

  const body = (await request.json()) as { name?: string; type?: string; path?: string };
  if (!body.name) {
    return Response.json({ error: 'File name is required' }, { status: 400 });
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/media/presign/${user.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({
      name: body.name,
      type: body.type ?? 'application/pdf',
      path: body.path ?? 'resume',
    }),
  });

  const payload = await response.text();
  return new Response(payload, {
    status: response.status,
    headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json' },
  });
}
