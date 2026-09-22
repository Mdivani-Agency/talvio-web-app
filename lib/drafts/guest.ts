import { GUEST_ID_KEY } from './keys';

export function createGuestId() {
  return crypto.randomUUID();
}

export function readGuestId(storage: Pick<Storage, 'getItem'> | null): string | null {
  if (!storage) {
    return null;
  }
  try {
    return storage.getItem(GUEST_ID_KEY);
  } catch {
    return null;
  }
}

export function getOrCreateGuestId(storage: Pick<Storage, 'getItem' | 'setItem'> | null): string | null {
  if (!storage) {
    return null;
  }
  const existing = readGuestId(storage);
  if (existing) {
    return existing;
  }
  const next = createGuestId();
  try {
    storage.setItem(GUEST_ID_KEY, next);
    return next;
  } catch {
    return null;
  }
}
