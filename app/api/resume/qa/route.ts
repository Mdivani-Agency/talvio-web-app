import { getResumeQuestions } from '@lib/clients/openai.client';
import { requireAiUser, spendAiRequest } from '@/lib/services/ai-cap.server';

export async function POST(request: Request) {
  const context = await requireAiUser(request);
  if (context instanceof Response) {
    return context;
  }

  try {
    const { resume } = await request.json();
    if (typeof resume !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid resume string.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const refused = await spendAiRequest(context);
    if (refused) {
      return refused;
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
