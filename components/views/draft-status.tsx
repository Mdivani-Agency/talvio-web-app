'use client';

import { Button } from '@components/ui';
import type { DraftPersistStatus } from '@lib/drafts';

type DraftStatusBannerProps = {
  status: DraftPersistStatus;
  guestDraft?: boolean;
  onAdoptGuest?: () => void;
  onDiscardGuest?: () => void;
  onKeepLocal?: () => void;
  onUseServer?: () => void;
};

export function DraftStatusBanner({
  status,
  guestDraft = false,
  onAdoptGuest,
  onDiscardGuest,
  onKeepLocal,
  onUseServer,
}: DraftStatusBannerProps) {
  if (guestDraft) {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-input bg-muted/40 px-4 py-2 text-sm" role="status">
        <p>A guest resume draft is on this browser. Keep it in this account?</p>
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={onAdoptGuest}>Keep draft</Button>
          <Button type="button" size="sm" variant="ghost" onClick={onDiscardGuest}>Discard</Button>
        </div>
      </div>
    );
  }

  if (status === 'quota') {
    return (
      <p className="border-b border-input bg-muted/40 px-4 py-2 text-sm" role="status">
        Local recovery is full. You can keep editing. Refresh may lose unsaved work.
      </p>
    );
  }

  if (status === 'unavailable') {
    return (
      <p className="border-b border-input bg-muted/40 px-4 py-2 text-sm" role="status">
        Local recovery is unavailable. You can keep editing. Refresh may lose unsaved work.
      </p>
    );
  }

  if (status === 'invalid') {
    return (
      <p className="border-b border-input bg-muted/40 px-4 py-2 text-sm" role="status">
        A stored draft could not be restored. You can keep editing.
      </p>
    );
  }

  if (status === 'conflict') {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-input bg-muted/40 px-4 py-2 text-sm" role="status">
        <p>The server copy is newer than this local draft.</p>
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={onUseServer}>Use server</Button>
          <Button type="button" size="sm" variant="ghost" onClick={onKeepLocal}>Keep a local copy</Button>
        </div>
      </div>
    );
  }

  return null;
}
