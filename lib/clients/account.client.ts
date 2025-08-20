import { Account, AccountDto } from '../types';
import { secureFetch } from './secure.client';

const ACCOUNT_API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/account`;

export const getAccount = async (userId: string): Promise<Account> => {
  const response = await secureFetch(`${ACCOUNT_API_URL}/${userId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};
