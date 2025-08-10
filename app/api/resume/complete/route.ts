import { parseResume } from '@lib/clients/openai.client';

export async function POST(request: Request) {
  try {
    const { resume, questions, answers } = await request.json();
    if (typeof resume !== 'string' || !Array.isArray(questions) || !Array.isArray(answers)) {
      return new Response(JSON.stringify({ error: 'Invalid input.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Compose a prompt for OpenAI
    const qaPairs = questions.map((q, i) => `Q: ${q}\nA: ${answers[i] || ''}`).join('\n');
    const parsed = await parseResume(resume, qaPairs);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update resume.', details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
