import { tailorAccount } from '@lib/clients/openai.client';

export async function POST(request: Request) {
  try {
    const { account, questions, answers } = await request.json();
    if (typeof account !== 'string' || !Array.isArray(questions) || !Array.isArray(answers)) {
      return new Response(JSON.stringify({ error: 'Missing or invalid account or answers string.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const qaPairs = questions.map((q, i) => `Q: ${q}\nA: ${answers[i] || ''}`).join('\n');

    const tailoredAccount = await tailorAccount(account, qaPairs);

    if (!tailoredAccount) {
      return new Response(JSON.stringify({ error: 'Failed to improve account.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ account: tailoredAccount }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('error', error);
    return new Response(JSON.stringify({ error: 'Failed to improve account.', details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
