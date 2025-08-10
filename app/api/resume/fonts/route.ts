import { fontsClient } from '@lib/clients/fonts.client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const family = searchParams.get('family');
  if (!family) {
    return new Response(JSON.stringify({ error: 'Missing family parameter.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const files = await fontsClient.getFontUrl(family);
  return new Response(JSON.stringify(files), {
    headers: { 'Content-Type': 'application/json' },
  });
}
