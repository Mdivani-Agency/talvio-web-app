import { tailorAccount } from '@lib/clients/openai.client';
import { requireAiUser, spendAiRequest } from '@/lib/services/ai-cap.server';

export async function POST(request: Request) {
  const context = await requireAiUser(request);
  if (context instanceof Response) {
    return context;
  }

  try {
    const { account, questions, answers } = await request.json();
    if (typeof account !== 'string' || !Array.isArray(questions) || !Array.isArray(answers)) {
      return new Response(JSON.stringify({ error: 'Missing or invalid account or answers string.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const refused = await spendAiRequest(context);
    if (refused) {
      return refused;
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
