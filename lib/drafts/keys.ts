import type { DraftOwner } from './schema';

export const DRAFT_KEY_PREFIX = 'talvio-draft-v1';
export const GUEST_ID_KEY = 'talvio-guest-id';

export function draftIdentityKey(kind: 'account' | 'resume', owner: DraftOwner, documentId = 'new') {
  if (owner.kind === 'guest') {
    return `${DRAFT_KEY_PREFIX}:${kind}:guest:${owner.guestId}`;
  }
  return `${DRAFT_KEY_PREFIX}:${kind}:user:${owner.userId}:${documentId}`;
}

export function accountDraftStorageKey(owner: Extract<DraftOwner, { kind: 'user' }>) {
  return draftIdentityKey('account', owner, 'profile');
}

export function resumeDraftStorageKey(owner: DraftOwner, documentId = 'new') {
  return draftIdentityKey('resume', owner, documentId);
}
