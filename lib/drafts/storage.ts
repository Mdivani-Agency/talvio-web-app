import {
  DRAFT_SCHEMA_VERSION,
  versionedDraftSchema,
  type DraftOwner,
  type DraftPersistStatus,
  type DraftReadResult,
  type VersionedDraft,
} from './schema';

export type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function isQuotaError(error: unknown) {
  return error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22);
}

export function browserStorage(): DraftStorage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const probe = '__talvio_draft_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function nowIso(date = new Date()) {
  return date.toISOString();
}

export function createDraftId() {
  return crypto.randomUUID();
}

export function createVersionedDraft(input: {
  kind: VersionedDraft['kind'];
  owner: DraftOwner;
  content: unknown;
  progress?: unknown;
  documentId?: string;
  draftId?: string;
  createdAt?: string;
  baseUpdatedAt?: string;
}): VersionedDraft {
  const timestamp = nowIso();
  return {
    schemaVersion: DRAFT_SCHEMA_VERSION,
    draftId: input.draftId ?? createDraftId(),
    owner: input.owner,
    kind: input.kind,
    ...(input.documentId ? { documentId: input.documentId } : {}),
    createdAt: input.createdAt ?? timestamp,
    updatedAt: timestamp,
    ...(input.baseUpdatedAt ? { baseUpdatedAt: input.baseUpdatedAt } : {}),
    content: input.content,
    ...(input.progress !== undefined ? { progress: input.progress } : {}),
  };
}

export function readDraft(storage: DraftStorage | null, key: string): DraftReadResult {
  if (!storage) {
    return { draft: null, status: 'unavailable' };
  }

  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return { draft: null, status: 'unavailable' };
  }

  if (!raw) {
    return { draft: null, status: 'ok' };
  }

  try {
    const parsed = versionedDraftSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return { draft: null, status: 'invalid' };
    }
    return { draft: parsed.data, status: 'ok' };
  } catch {
    return { draft: null, status: 'invalid' };
  }
}

export function writeDraft(
  storage: DraftStorage | null,
  key: string,
  draft: VersionedDraft,
): DraftPersistStatus {
  if (!storage) {
    return 'unavailable';
  }
  const parsed = versionedDraftSchema.safeParse(draft);
  if (!parsed.success) {
    return 'invalid';
  }
  try {
    storage.setItem(key, JSON.stringify(parsed.data));
    return 'ok';
  } catch (error) {
    return isQuotaError(error) ? 'quota' : 'unavailable';
  }
}

export function clearDraft(storage: DraftStorage | null, key: string): DraftPersistStatus {
  if (!storage) {
    return 'unavailable';
  }
  try {
    storage.removeItem(key);
    return 'ok';
  } catch {
    return 'unavailable';
  }
}

export function isServerNewer(baseUpdatedAt?: string, serverUpdatedAt?: string) {
  if (!baseUpdatedAt || !serverUpdatedAt) {
    return false;
  }
  const base = Date.parse(baseUpdatedAt);
  const server = Date.parse(serverUpdatedAt);
  if (Number.isNaN(base) || Number.isNaN(server)) {
    return false;
  }
  return server > base;
}

export function adoptDraft(draft: VersionedDraft, owner: DraftOwner): VersionedDraft {
  return {
    ...draft,
    owner,
    updatedAt: nowIso(),
  };
}

export function copyDraftForRecovery(draft: VersionedDraft): VersionedDraft {
  return {
    ...draft,
    draftId: createDraftId(),
    documentId: undefined,
    baseUpdatedAt: undefined,
    updatedAt: nowIso(),
  };
}

export type DebouncedWriter<T> = {
  schedule(value: T): void;
  flush(): void;
  cancel(): void;
};

export function createDebouncedWriter<T>(
  write: (value: T) => void,
  wait = 400,
): DebouncedWriter<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: T | undefined;
  let hasPending = false;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  return {
    schedule(value: T) {
      pending = value;
      hasPending = true;
      clearTimer();
      timer = setTimeout(() => {
        if (hasPending) {
          write(pending as T);
          hasPending = false;
        }
      }, wait);
    },
    flush() {
      clearTimer();
      if (hasPending) {
        write(pending as T);
        hasPending = false;
      }
    },
    cancel() {
      clearTimer();
      hasPending = false;
      pending = undefined;
    },
  };
}
