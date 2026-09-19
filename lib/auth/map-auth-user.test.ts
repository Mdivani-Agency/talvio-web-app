import { describe, expect, it } from 'vitest';

import { mapAuthUser } from './map-auth-user';

describe('mapAuthUser', () => {
  it('maps id, email, and metadata name/avatar', () => {
    const user = mapAuthUser({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      email: 'ann@talvio.test',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
      user_metadata: {
        full_name: 'Ann Alpha',
        avatar_url: 'https://lh3.googleusercontent.com/ann.png',
      },
    } as never);

    expect(user).toMatchObject({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      email: 'ann@talvio.test',
      name: 'Ann Alpha',
      image: 'https://lh3.googleusercontent.com/ann.png',
    });
    expect(user.createdAt.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(user.updatedAt.toISOString()).toBe('2026-01-02T00:00:00.000Z');
  });

  it('falls back to name and picture keys and empty email', () => {
    const user = mapAuthUser({
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      created_at: '2026-01-01T00:00:00.000Z',
      user_metadata: {
        name: 'Bob',
        picture: 'https://media.licdn.com/bob.png',
      },
    } as never);

    expect(user.email).toBe('');
    expect(user.name).toBe('Bob');
    expect(user.image).toBe('https://media.licdn.com/bob.png');
  });
});
