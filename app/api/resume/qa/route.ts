import { getResumeQuestions } from '@lib/clients/openai.client';

export async function POST(request: Request) {
  try {
    const { resume } = await request.json();
    if (typeof resume !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid resume string.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const questions = await getResumeQuestions(resume);

    return new Response(JSON.stringify({ questions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('error', error);
    return new Response(JSON.stringify({ error: 'Failed to generate questions.', details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
