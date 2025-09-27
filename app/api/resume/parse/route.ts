import { textToStructuredResume } from '@lib/clients/openai.client';

export async function POST(request: Request) {
  try {
    const { resume } = await request.json();
    if (typeof resume !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid resume string.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const parsed = await textToStructuredResume(resume);
    console.log('response raw', parsed);
    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message || 'Failed to parse resume.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
