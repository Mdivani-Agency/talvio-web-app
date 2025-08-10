import { FeedbackQuestions } from '@lib/clients/openai.client';
import { transformToPartial } from '@lib/utils';
import { Account, ParsedAccount } from '@lib/types';

export const fetchQuestions = async (resume: string) => {
  const res = await fetch('/api/resume/qa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume }),
  });
  if (!res.ok) throw new Error('Failed to fetch questions');
  const data = await res.json();
  return data.questions as FeedbackQuestions;
};

export const updateResume = async (resume: string, questions: string[], answers: string[]) => {
  try {
    const res = await fetch('/api/resume/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume, questions, answers }),
    });
    if (!res.ok) throw new Error('Failed to update resume');
    const data = await res.json();
    return transformToPartial(data) as Account;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const parseResume = async (resume: string) => {
  const res = await fetch('/api/resume/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume }),
  });
  if (!res.ok) throw new Error('Failed to parse resume');
  const data = await res.json();
  return transformToPartial(JSON.parse(data)) as ParsedAccount;
};

export const fetchTailoredAccount = async (account: string, questions: string[], answers: string[]) => {
  const res = await fetch('/api/resume/account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account, questions, answers }),
  });
  if (!res.ok) throw new Error('Failed to tailor account');
  const data = await res.json();
  return transformToPartial(data.account as ParsedAccount);
};
