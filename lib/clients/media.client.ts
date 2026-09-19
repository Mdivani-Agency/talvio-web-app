import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const MEDIA_API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/media`;

export interface MediaItem {
  key: string;
  userId: string;
  name: string;
  type: string;
  publicUrl: string;
  createdAt?: string;
}

async function mediaFetch(url: string, options: RequestInit = {}) {
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (!accessToken) {
    throw new Error('No token found');
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export const getDocuments = async (userId: string) => {
  const response = await mediaFetch(`${MEDIA_API_URL}/${userId}/records`, {
    method: 'GET',
  });
  return response.json() as Promise<{ items: MediaItem[], nextToken?: string }>;
};

export const fetchPdfFile = async (publicUrl: string) => {
  const response = await fetch(publicUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/pdf',
    }
  });
  return response.blob();
};
