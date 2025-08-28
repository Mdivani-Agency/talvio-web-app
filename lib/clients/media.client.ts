import { secureFetch } from "./secure.client";

const MEDIA_API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/media`;

export interface MediaItem {
  key: string;
  userId: string;
  name: string;
  type: string;
  publicUrl: string;
  createdAt?: string;
}

export const getDocuments = async (userId: string) => {
  const response = await secureFetch(`${MEDIA_API_URL}/${userId}/records`, {
    method: 'GET',
  });
  return response.json() as Promise<{ items: MediaItem[], nextToken?: string }>;
};
