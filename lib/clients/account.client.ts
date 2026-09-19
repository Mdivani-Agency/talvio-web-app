import { Account, AccountDto } from '../types';
import { secureFetch } from './secure.client';

const ACCOUNT_API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/account`;

export class AccountRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AccountRequestError';
    this.status = status;
  }
}

async function rejectIfNotOk(response: Response) {
  if (response.ok) {
    return;
  }

  let message = `Request failed (${response.status})`;
  try {
    const body = (await response.json()) as { message?: string };
    if (typeof body?.message === 'string' && body.message) {
      message = body.message;
    }
  } catch {
    // non-JSON error body from an auth mismatch or gateway
  }

  throw new AccountRequestError(response.status, message);
}

export const getAccount = async (userId: string): Promise<Account> => {
  const response = await secureFetch(`${ACCOUNT_API_URL}/${userId}`, {
    method: 'GET',
  });

  await rejectIfNotOk(response);
  return response.json();
};

export const createAccount = async ({
  userId,
  accountDto,
}: {
  userId: string;
  accountDto: AccountDto;
}): Promise<Account> => {
  const response = await secureFetch(`${ACCOUNT_API_URL}/${userId}`, {
    method: 'POST',
    body: JSON.stringify(accountDto),
  });

  await rejectIfNotOk(response);
  return response.json();
};
