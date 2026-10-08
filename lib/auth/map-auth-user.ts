import type { User as AuthUser } from '@supabase/supabase-js';

import type { User } from '@lib/types';

export function mapAuthUser(user: AuthUser): User {
  const metadata = user.user_metadata ?? {};
  const name =
    (typeof metadata.full_name === 'string' && metadata.full_name) ||
    (typeof metadata.name === 'string' && metadata.name) ||
    null;
  const image =
    (typeof metadata.avatar_url === 'string' && metadata.avatar_url) ||
    (typeof metadata.picture === 'string' && metadata.picture) ||
    null;

  return {
    id: user.id,
    email: user.email ?? '',
    name,
    image,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at ?? user.created_at),
  };
}
