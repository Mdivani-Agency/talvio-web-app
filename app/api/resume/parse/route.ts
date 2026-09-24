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
    const scenario = process.env.OPENAI_BASE_URL
      ? request.headers.get('x-e2e-scenario')
      : null;
    const parsed = await textToStructuredResume(resume, scenario);
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
