import { transformToPartial } from '@lib/utils';
import { Account, AccountDto, FeedbackQuestions, ParsedAccount } from '@lib/types';

export const fetchQuestions = async (resume: string) => {
  const res = await fetch('/api/resume/qa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume }),
  });
  if (!res.ok) throw new Error('Failed to fetch questions');
  const data = await res.json();
  console.log('questions', data);
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
  try {
    const data = await res.json();
    if (typeof data !== 'string') {
      throw new Error('Failed to parse resume');
    }
    return transformToPartial(JSON.parse(data)) as ParsedAccount;
  } catch (error) {
    if (error instanceof Error && error.message === 'Failed to parse resume') {
      throw error;
    }
    throw new Error('Failed to parse resume');
  }
};

export const fetchTailoredAccount = async (account: string, questions: string[], answers: string[]) => {
  const res = await fetch('/api/resume/account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account, questions, answers }),
  });
  if (!res.ok) throw new Error('Failed to tailor account');
  const data = await res.json();
  return transformToPartial(data.account as ParsedAccount) as AccountDto;
};
